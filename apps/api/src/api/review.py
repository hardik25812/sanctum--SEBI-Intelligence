"""Human review queue for escalated/blocked traces."""
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_session
from src.models.trace import Trace

router = APIRouter(prefix="/api/review", tags=["review"])


class ReviewAction(BaseModel):
    action: str  # "approve" | "reject" | "reassign"
    reviewer_note: str = ""


@router.get("/queue")
async def review_queue(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Trace)
        .where(Trace.final_verdict.in_(["escalated", "blocked"]))
        .order_by(Trace.created_at.desc())
        .limit(100)
    )
    traces = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "created_at": t.created_at.isoformat(),
            "query": t.query,
            "final_verdict": t.final_verdict,
            "client_profile_id": str(t.client_profile_id),
            "total_latency_ms": t.total_latency_ms,
        }
        for t in traces
    ]


@router.post("/{trace_id}")
async def review_trace(
    trace_id: uuid.UUID,
    body: ReviewAction,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Trace).where(Trace.id == trace_id)
    )
    trace = result.scalar_one_or_none()
    if not trace:
        return {"error": "Trace not found"}

    if body.action == "approve":
        trace.final_verdict = "approved"
    elif body.action == "reject":
        trace.final_verdict = "blocked"

    await session.commit()

    return {
        "id": str(trace.id),
        "final_verdict": trace.final_verdict,
        "reviewer_note": body.reviewer_note,
        "action": body.action,
    }
