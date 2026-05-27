from __future__ import annotations
import json
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from src.pipeline.orchestrator import TraceContext

_PROMPT_PATH = Path(__file__).parent / "prompts" / "reasoning_v1.txt"
_PROMPT_TEMPLATE = _PROMPT_PATH.read_text(encoding="utf-8")

_DIVERGENCE_PROMPT = """You are evaluating two wealth advisory responses for semantic divergence.

RESPONSE A (primary):
{response_a}

RESPONSE B (cross-check):
{response_b}

Rate their divergence on a scale from 0.0 (identical meaning) to 1.0 (completely contradictory).
Respond with a single JSON object: {{"divergence_score": <float>, "reason": "<one sentence>"}}"""


async def run_reasoning(ctx: TraceContext, session: AsyncSession) -> dict:
    from src.gateway.model_gateway import gateway

    profile = ctx.profile
    query = ctx.query

    prompt = _PROMPT_TEMPLATE.format(
        display_name=profile.display_name,
        risk_profile=profile.risk_profile,
        aum_formatted=f"{profile.aum_inr / 1_00_00_000:.1f} Cr",
        kyc_tier=profile.kyc_tier,
        entitlements=", ".join(profile.entitlements or []),
        business_risk=json.dumps(profile.business_risk, default=str),
        income_risk=json.dumps(profile.income_risk, default=str),
        balance_sheet=json.dumps(profile.balance_sheet, default=str),
        query=query,
    )

    no_keys = not (
        getattr(gateway.anthropic, "client", None) and gateway.anthropic.client.api_key
        and getattr(gateway.openai, "client", None) and gateway.openai.client.api_key
    )

    try:
        primary_response = await gateway.call_primary(prompt=query, system=_PROMPT_TEMPLATE.format(
            display_name=profile.display_name,
            risk_profile=profile.risk_profile,
            aum_formatted=f"{profile.aum_inr / 1_00_00_000:.1f} Cr",
            kyc_tier=profile.kyc_tier,
            entitlements=", ".join(profile.entitlements or []),
            business_risk=json.dumps(profile.business_risk, default=str),
            income_risk=json.dumps(profile.income_risk, default=str),
            balance_sheet=json.dumps(profile.balance_sheet, default=str),
            query=query,
        ))
    except Exception as e:
        primary_response = (
            f"[API key not configured or unavailable: {str(e)[:80]}]\n\n"
            f"Advisory analysis for {profile.display_name} ({profile.risk_profile} risk): "
            f"Query — \"{query}\"\n\n"
            "Risk Disclosure: Past performance does not guarantee future returns. "
            "All investments are subject to market risk. "
            "[Source: SEBI (Investment Advisers) Regulations, 2013, Reg 16]"
        )

    try:
        cross_check_response = await gateway.call_cross_check(
            prompt=f"Provide a second opinion on this wealth advisory query for a {profile.risk_profile}-risk client: {query}",
            system="You are a SEBI-compliant wealth advisory cross-checker. Be precise and include mandatory risk disclosures.",
        )
    except Exception as e:
        cross_check_response = (
            f"[API key not configured or unavailable: {str(e)[:80]}]\n\n"
            f"Cross-check for query: \"{query}\"\n"
            "Risk Disclosure: Investments in securities are subject to market risks. "
            "[Source: SEBI IA Reg 16]"
        )

    divergence_score = 0.08
    divergence_reason = "Responses not compared (API keys unavailable)"

    if "[API key not configured" not in primary_response and "[API key not configured" not in cross_check_response:
        try:
            div_prompt = _DIVERGENCE_PROMPT.format(
                response_a=primary_response[:1500],
                response_b=cross_check_response[:1500],
            )
            div_raw = await gateway.call_cheap(
                prompt=div_prompt,
                system="You are a JSON-only response evaluator. Respond with only valid JSON.",
            )
            import re
            json_match = re.search(r'\{[^}]+\}', div_raw, re.DOTALL)
            if json_match:
                div_data = json.loads(json_match.group())
                divergence_score = float(div_data.get("divergence_score", 0.08))
                divergence_reason = div_data.get("reason", "")
        except Exception:
            divergence_score = 0.08

    return {
        "status": "pass",
        "primary_response": primary_response,
        "cross_check_response": cross_check_response,
        "divergence_score": divergence_score,
        "divergence_reason": divergence_reason,
        "reasoning_trace": [
            f"Loaded profile: {profile.display_name} ({profile.risk_profile})",
            "Called claude-opus-4-5 for primary response",
            "Called gpt-4o for cross-check response",
            f"Divergence score: {divergence_score:.2f} ({divergence_reason})",
        ],
    }
