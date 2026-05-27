import uuid
from datetime import datetime

from pydantic import BaseModel


class ClientProfileCreate(BaseModel):
    display_name: str
    aum_inr: int
    business_risk: dict
    income_risk: dict
    balance_sheet: dict
    risk_profile: str
    kyc_tier: str
    entitlements: list[str]


class ClientProfileOut(BaseModel):
    id: uuid.UUID
    created_at: datetime
    display_name: str
    aum_inr: int
    business_risk: dict
    income_risk: dict
    balance_sheet: dict
    risk_profile: str
    kyc_tier: str
    entitlements: list[str]

    model_config = {"from_attributes": True}


class IntakeRequest(BaseModel):
    client_profile_id: uuid.UUID
    query: str


class TraceStepOut(BaseModel):
    id: uuid.UUID
    step_number: int
    step_name: str
    status: str
    latency_ms: int
    input_hash: str
    output_hash: str
    payload: dict
    failure_reason: str | None
    created_at: datetime | None

    model_config = {"from_attributes": True}


class TraceOut(BaseModel):
    id: uuid.UUID
    created_at: datetime
    client_profile_id: uuid.UUID
    query: str
    final_verdict: str
    final_output: str | None
    total_latency_ms: int
    primary_model: str
    cross_check_model: str
    steps: list[TraceStepOut] = []
    client_profile: ClientProfileOut | None = None

    model_config = {"from_attributes": True}


class TraceListOut(BaseModel):
    id: uuid.UUID
    created_at: datetime
    client_profile_id: uuid.UUID
    query: str
    final_verdict: str
    total_latency_ms: int
    primary_model: str
    cross_check_model: str

    model_config = {"from_attributes": True}
