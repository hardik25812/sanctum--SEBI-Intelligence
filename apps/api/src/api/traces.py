import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db import get_session
from src.models.trace import Trace, ClientProfile
from src.schemas import TraceOut, TraceListOut

router = APIRouter(prefix="/api/traces", tags=["traces"])


@router.get("", response_model=list[TraceListOut])
async def list_traces(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Trace).order_by(Trace.created_at.desc()).limit(100)
    )
    return result.scalars().all()


@router.get("/{trace_id}", response_model=TraceOut)
async def get_trace(trace_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Trace)
        .options(selectinload(Trace.steps), selectinload(Trace.client_profile))
        .where(Trace.id == trace_id)
    )
    trace = result.scalar_one()
    return trace
