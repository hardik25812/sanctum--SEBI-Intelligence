from __future__ import annotations
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from src.pipeline.orchestrator import TraceContext


DETERMINISTIC_RULES = [
    {
        "id": "SEBI_IA_REG_16_1_A",
        "pattern": r"\bguaranteed?\s+return",
        "violation": "GUARANTEED_RETURN",
        "description": "Explicit guarantee of returns violates SEBI IA Reg 16(1)(a)",
    },
    {
        "id": "SEBI_IA_REG_16_1_B",
        "pattern": r"\bwill\s+return\s+\d+%",
        "violation": "DEFINITE_RETURN_CLAIM",
        "description": "Definite return percentage claim violates SEBI IA Reg 16(1)(b)",
    },
    {
        "id": "SEBI_IA_REG_16_1_C",
        "pattern": r"\b(likely|should|expected|could|would)\s+(to\s+)?(return|deliver|give|yield|compound|generate)\s+\d+",
        "violation": "IMPLICIT_RETURN",
        "description": "Implicit return guarantee violates SEBI IA Reg 16(1)(c)",
    },
    {
        "id": "SEBI_IA_REG_16_1_D",
        "pattern": r"\brisk[\s-]*free\b",
        "violation": "RISK_FREE_CLAIM",
        "description": "Risk-free claim violates SEBI IA Reg 16(1)(d)",
    },
    {
        "id": "SEBI_IA_REG_16_DISCLOSURE",
        "pattern": None,
        "violation": "MISSING_RISK_DISCLOSURE",
        "description": "Missing mandatory risk disclosure per SEBI IA Reg 16",
    },
]

RISK_DISCLOSURE_KEYWORDS = [
    "market risk",
    "past performance",
    "risk disclosure",
    "subject to market",
    "no guarantee",
]


async def run_compliance(ctx: TraceContext, session: AsyncSession) -> dict:
    reasoning = ctx.layer_outputs.get("reasoning", {})
    primary_response = reasoning.get("primary_response", "")
    query = ctx.query

    text_to_check = f"{query} {primary_response}"
    violations = []

    for rule in DETERMINISTIC_RULES:
        if rule["pattern"] is not None:
            if re.search(rule["pattern"], text_to_check, re.IGNORECASE):
                violations.append({
                    "rule_id": rule["id"],
                    "violation_type": rule["violation"],
                    "description": rule["description"],
                    "source_text": _extract_match(rule["pattern"], text_to_check),
                })
        elif rule["violation"] == "MISSING_RISK_DISCLOSURE":
            has_disclosure = any(
                kw in primary_response.lower() for kw in RISK_DISCLOSURE_KEYWORDS
            )
            if not has_disclosure:
                violations.append({
                    "rule_id": rule["id"],
                    "violation_type": rule["violation"],
                    "description": rule["description"],
                    "source_text": "",
                })

    passed = len(violations) == 0

    return {
        "status": "pass" if passed else "fail",
        "failure_reason": f"Violations: {[v['violation_type'] for v in violations]}" if not passed else None,
        "violations": violations,
        "passed": passed,
        "total_rules_checked": len(DETERMINISTIC_RULES),
    }


def _extract_match(pattern: str, text: str) -> str:
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        start = max(0, match.start() - 30)
        end = min(len(text), match.end() + 30)
        return text[start:end]
    return ""
