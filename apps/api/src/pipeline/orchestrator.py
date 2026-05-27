import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.models.trace import ClientProfile, Trace, TraceStep
from src.models.audit import AuditLog
from src.pipeline.intake import run_intake
from src.pipeline.distribution import run_distribution
from src.pipeline.reasoning import run_reasoning
from src.pipeline.grounding import run_grounding
from src.pipeline.compliance import run_compliance
from src.pipeline.audit import run_audit


@dataclass
class TraceContext:
    trace_id: uuid.UUID
    profile: ClientProfile | None = None
    query: str = ""
    layer_outputs: dict = field(default_factory=dict)
    failed: bool = False
    failure_layer: str | None = None
    failure_reason: str | None = None


def sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


LAYERS = [
    ("intake", run_intake),
    ("distribution", run_distribution),
    ("reasoning", run_reasoning),
    ("grounding", run_grounding),
    ("compliance", run_compliance),
    ("audit", run_audit),
]


async def run_pipeline(
    client_profile_id: uuid.UUID,
    query: str,
    session: AsyncSession,
) -> Trace:
    trace_id = uuid.uuid4()
    ctx = TraceContext(trace_id=trace_id, query=query)

    result = await session.execute(
        select(ClientProfile).where(ClientProfile.id == client_profile_id)
    )
    ctx.profile = result.scalar_one()

    total_start = time.monotonic()
    steps: list[TraceStep] = []

    for step_number, (layer_name, layer_fn) in enumerate(LAYERS, start=1):
        step_start = time.monotonic()
        input_data = json.dumps({"query": query, "layer_outputs": str(ctx.layer_outputs)}, default=str)
        input_hash = sha256(input_data)

        try:
            if ctx.failed and layer_name != "audit":
                output = {"skipped": True, "reason": f"prior failure at {ctx.failure_layer}"}
                status = "skipped"
                failure_reason = None
            else:
                output = await layer_fn(ctx, session)
                ctx.layer_outputs[layer_name] = output
                status = output.get("status", "pass")
                failure_reason = output.get("failure_reason")

                if status == "fail":
                    ctx.failed = True
                    ctx.failure_layer = layer_name
                    ctx.failure_reason = failure_reason
        except Exception as e:
            output = {"error": str(e)}
            status = "fail"
            failure_reason = str(e)
            ctx.failed = True
            ctx.failure_layer = layer_name
            ctx.failure_reason = str(e)

        latency_ms = int((time.monotonic() - step_start) * 1000)
        output_hash = sha256(json.dumps(output, default=str))

        step = TraceStep(
            id=uuid.uuid4(),
            trace_id=trace_id,
            step_number=step_number,
            step_name=layer_name,
            status=status,
            latency_ms=latency_ms,
            input_hash=input_hash,
            output_hash=output_hash,
            payload=output,
            failure_reason=failure_reason,
        )
        steps.append(step)

    total_latency_ms = int((time.monotonic() - total_start) * 1000)

    if ctx.failed:
        final_verdict = "blocked"
        final_output = None
    else:
        final_verdict = "approved"
        reasoning_output = ctx.layer_outputs.get("reasoning", {})
        final_output = reasoning_output.get("primary_response", "")

    divergence = ctx.layer_outputs.get("reasoning", {}).get("divergence_score", 0)
    if divergence > 0.35 and not ctx.failed:
        final_verdict = "escalated"

    trace = Trace(
        id=trace_id,
        client_profile_id=client_profile_id,
        query=query,
        final_verdict=final_verdict,
        final_output=final_output,
        total_latency_ms=total_latency_ms,
        primary_model="claude-opus-4-5",
        cross_check_model="gpt-4o",
    )

    session.add(trace)
    for step in steps:
        session.add(step)

    await _write_audit_log(session, trace_id, final_verdict, ctx)
    await session.commit()

    result = await session.execute(
        select(Trace)
        .options(selectinload(Trace.steps), selectinload(Trace.client_profile))
        .where(Trace.id == trace_id)
    )
    return result.scalar_one()


async def _write_audit_log(
    session: AsyncSession,
    trace_id: uuid.UUID,
    verdict: str,
    ctx: TraceContext,
) -> None:
    from sqlalchemy import func, select as sa_select

    last = await session.execute(
        sa_select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
    )
    last_row = last.scalar_one_or_none()
    prev_hash = last_row.row_hash if last_row else "0" * 64

    import datetime
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "verdict": verdict,
        "failure_layer": ctx.failure_layer,
        "failure_reason": ctx.failure_reason,
    }
    raw = f"{prev_hash}{trace_id}{verdict}{json.dumps(payload, default=str)}{now.isoformat()}"
    row_hash = sha256(raw)

    audit = AuditLog(
        trace_id=trace_id,
        event_type=verdict,
        prev_hash=prev_hash,
        row_hash=row_hash,
        payload=payload,
        created_at=now,
    )
    session.add(audit)
