import uuid
from datetime import datetime

from pydantic import BaseModel


class EvalRunOut(BaseModel):
    id: uuid.UUID
    suite_name: str
    git_commit: str
    started_at: datetime
    completed_at: datetime | None
    total_cases: int
    passed: int
    failed: int
    results: dict

    model_config = {"from_attributes": True}
