from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_session
from src.models.trace import ClientProfile
from src.schemas import IntakeRequest, TraceOut, ClientProfileCreate, ClientProfileOut
from src.pipeline.orchestrator import run_pipeline

router = APIRouter(prefix="/api", tags=["intake"])


@router.get("/profiles", response_model=list[ClientProfileOut])
async def list_profiles(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(ClientProfile).order_by(ClientProfile.created_at.desc()).limit(50)
    )
    return result.scalars().all()


@router.post("/profiles", response_model=ClientProfileOut)
async def create_profile(
    body: ClientProfileCreate, session: AsyncSession = Depends(get_session)
):
    profile = ClientProfile(**body.model_dump())
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.post("/intake", response_model=TraceOut)
async def submit_intake(
    body: IntakeRequest, session: AsyncSession = Depends(get_session)
):
    trace = await run_pipeline(
        client_profile_id=body.client_profile_id,
        query=body.query,
        session=session,
    )
    return trace
