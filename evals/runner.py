"""Eval runner — executes YAML test cases against the live Sanctum pipeline."""
import argparse
import asyncio
import glob
import hashlib
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import yaml
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://sanctum:sanctum@localhost:5432/sanctum")
API_URL = os.getenv("API_URL", "http://localhost:8000")

SUITES_DIR = Path(__file__).parent / "suites"

SUITE_NAMES = [
    "sebi_ia_regulations",
    "implicit_return_guarantee",
    "citation_grounding",
    "ood_intake",
    "prompt_injection",
    "concentration_risk",
    "advisory_tone",
]


def load_suite(suite_name: str) -> list[dict]:
    suite_dir = SUITES_DIR / suite_name
    if not suite_dir.exists():
        print(f"  WARNING: Suite directory {suite_dir} does not exist")
        return []

    cases = []
    for yaml_file in sorted(suite_dir.glob("*.yaml")):
        with open(yaml_file, "r", encoding="utf-8") as f:
            case = yaml.safe_load(f)
            if case:
                cases.append(case)
    return cases


async def run_case(case: dict) -> dict:
    """Run a single eval case against the API."""
    import httpx

    profile_id = case.get("input", {}).get("profile_id", "00000000-0000-0000-0000-000000000001")
    if profile_id.startswith("seed_"):
        profile_id = "00000000-0000-0000-0000-000000000001"

    query = case.get("input", {}).get("query", "")
    expected = case.get("expected", {})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{API_URL}/api/intake",
                json={"client_profile_id": profile_id, "query": query},
            )
            if resp.status_code != 200:
                return {
                    "case_id": case.get("id", "unknown"),
                    "passed": False,
                    "reason": f"API returned {resp.status_code}: {resp.text[:200]}",
                }

            trace = resp.json()
    except Exception as e:
        return {
            "case_id": case.get("id", "unknown"),
            "passed": False,
            "reason": f"API call failed: {str(e)}",
        }

    passed = True
    reasons = []

    expected_verdict = expected.get("verdict")
    if expected_verdict and trace.get("final_verdict") != expected_verdict:
        passed = False
        reasons.append(f"Expected verdict={expected_verdict}, got={trace.get('final_verdict')}")

    expected_layer = expected.get("failed_layer")
    if expected_layer:
        steps = trace.get("steps", [])
        failed_steps = [s for s in steps if s.get("status") == "fail"]
        failed_names = [s.get("step_name") for s in failed_steps]
        if expected_layer not in failed_names:
            passed = False
            reasons.append(f"Expected failed_layer={expected_layer}, got={failed_names}")

    violation_contains = expected.get("violation_contains", [])
    if violation_contains:
        steps = trace.get("steps", [])
        compliance_step = next((s for s in steps if s.get("step_name") == "compliance"), None)
        if compliance_step:
            violations = compliance_step.get("payload", {}).get("violations", [])
            violation_types = [v.get("violation_type", "") for v in violations]
            violation_ids = [v.get("rule_id", "") for v in violations]
            all_violation_text = " ".join(violation_types + violation_ids)
            for expected_token in violation_contains:
                if expected_token.upper() not in all_violation_text.upper():
                    passed = False
                    reasons.append(f"Expected violation containing '{expected_token}', got: {all_violation_text}")

    return {
        "case_id": case.get("id", "unknown"),
        "passed": passed,
        "reason": "; ".join(reasons) if reasons else "ok",
        "trace_id": trace.get("id"),
        "verdict": trace.get("final_verdict"),
    }


async def run_suite(suite_name: str) -> dict:
    cases = load_suite(suite_name)
    if not cases:
        return {"suite": suite_name, "total": 0, "passed": 0, "failed": 0, "results": []}

    print(f"\n  Running suite: {suite_name} ({len(cases)} cases)")
    results = []
    for i, case in enumerate(cases):
        result = await run_case(case)
        results.append(result)
        status = "PASS" if result["passed"] else "FAIL"
        severity = case.get("severity", "normal")
        print(f"    [{i+1}/{len(cases)}] {result['case_id']} — {status}" +
              (f" ({result['reason']})" if not result["passed"] else ""))

    passed = sum(1 for r in results if r["passed"])
    failed = len(results) - passed
    return {
        "suite": suite_name,
        "total": len(cases),
        "passed": passed,
        "failed": failed,
        "results": results,
    }


async def write_eval_run(suite_result: dict, git_commit: str):
    engine = create_async_engine(DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession)

    async with session_factory() as session:
        now = datetime.now(timezone.utc)
        run_id = str(uuid.uuid4())
        await session.execute(
            text("""
                INSERT INTO eval_runs (id, suite_name, git_commit, started_at, completed_at, total_cases, passed, failed, results)
                VALUES (:id, :suite, :commit, :started, :completed, :total, :passed, :failed, :results::jsonb)
            """),
            {
                "id": run_id,
                "suite": suite_result["suite"],
                "commit": git_commit,
                "started": now,
                "completed": now,
                "total": suite_result["total"],
                "passed": suite_result["passed"],
                "failed": suite_result["failed"],
                "results": json.dumps(suite_result["results"], default=str),
            },
        )
        await session.commit()

    await engine.dispose()


async def main(suite_filter: str, git_commit: str):
    suites = SUITE_NAMES if suite_filter == "all" else [suite_filter]
    any_critical_failure = False

    for suite_name in suites:
        result = await run_suite(suite_name)
        if result["total"] > 0:
            await write_eval_run(result, git_commit)
            rate = (result["passed"] / result["total"] * 100) if result["total"] > 0 else 0
            print(f"\n  {suite_name}: {result['passed']}/{result['total']} ({rate:.1f}%)")

            if result["failed"] > 0:
                cases = load_suite(suite_name)
                case_map = {c.get("id"): c for c in cases}
                for r in result["results"]:
                    if not r["passed"]:
                        case = case_map.get(r["case_id"], {})
                        if case.get("severity") == "critical":
                            any_critical_failure = True

    if any_critical_failure:
        print("\nCRITICAL FAILURES DETECTED — exit code 1")
        sys.exit(1)
    else:
        print("\nAll suites complete.")
        sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sanctum eval runner")
    parser.add_argument("--suite", default="all", help="Suite name or 'all'")
    parser.add_argument("--commit", default="dev", help="Git commit hash")
    args = parser.parse_args()
    asyncio.run(main(args.suite, args.commit))
