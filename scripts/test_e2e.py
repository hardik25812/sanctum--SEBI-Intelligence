"""Quick end-to-end test: submit an intake and print the trace."""
import asyncio
import json
import httpx

API = "http://localhost:8000"


async def main():
    async with httpx.AsyncClient(timeout=120) as client:
        print("1. Checking health...")
        r = await client.get(f"{API}/health")
        print(f"   Health: {r.json()}")

        print("2. Listing profiles...")
        r = await client.get(f"{API}/api/profiles")
        print(f"   Status: {r.status_code}, Body: {r.text[:300]}")
        profiles = r.json()
        print(f"   Found {len(profiles)} profiles")
        if not profiles:
            print("   ERROR: No profiles found. Run seed.py first.")
            return

        profile_id = profiles[0]["id"]
        print(f"   Using profile: {profiles[0]['display_name']} ({profile_id})")

        print("3. Submitting intake query...")
        r = await client.post(
            f"{API}/api/intake",
            json={
                "client_profile_id": profile_id,
                "query": "Should I invest 40% of my portfolio in a mid-cap equity fund given my moderate risk profile?",
            },
        )
        if r.status_code != 200:
            print(f"   ERROR: {r.status_code} — {r.text[:500]}")
            return

        trace = r.json()
        print(f"   Trace ID: {trace['id']}")
        print(f"   Verdict: {trace['final_verdict']}")
        print(f"   Latency: {trace['total_latency_ms']}ms")
        print(f"   Steps:")
        for step in trace.get("steps", []):
            print(f"     [{step['step_number']}] {step['step_name']}: {step['status']} ({step['latency_ms']}ms)")
            if step.get("failure_reason"):
                print(f"         Failure: {step['failure_reason']}")

        if trace.get("final_output"):
            print(f"\n   Final output (first 300 chars):")
            print(f"   {trace['final_output'][:300]}")

        print("\n4. Fetching trace from /api/traces...")
        r = await client.get(f"{API}/api/traces")
        traces = r.json()
        print(f"   Total traces: {len(traces)}")

        print("\n5. Fetching trace detail...")
        r = await client.get(f"{API}/api/traces/{trace['id']}")
        detail = r.json()
        print(f"   Query: {detail['query']}")
        print(f"   Verdict: {detail['final_verdict']}")

        print("\nEnd-to-end test PASSED.")


if __name__ == "__main__":
    asyncio.run(main())
