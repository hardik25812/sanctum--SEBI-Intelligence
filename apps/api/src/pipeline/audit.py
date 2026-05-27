from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from src.pipeline.orchestrator import TraceContext


async def run_audit(ctx: TraceContext, session: AsyncSession) -> dict:
    if ctx.failed:
        verdict = "blocked"
        delivery = "Recommendation withheld pending human review."
    else:
        verdict = "approved"
        reasoning = ctx.layer_outputs.get("reasoning", {})
        delivery = reasoning.get("primary_response", "")

    return {
        "status": "pass",
        "verdict": verdict,
        "delivery": delivery,
        "trace_id": str(ctx.trace_id),
        "failure_layer": ctx.failure_layer,
        "failure_reason": ctx.failure_reason,
    }
