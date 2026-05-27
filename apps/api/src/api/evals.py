from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_session
from src.models.source import EvalRun
from src.schemas import EvalRunOut

router = APIRouter(prefix="/api/evals", tags=["evals"])


@router.get("", response_model=list[EvalRunOut])
async def list_eval_runs(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(EvalRun).order_by(EvalRun.started_at.desc()).limit(50)
    )
    return result.scalars().all()
