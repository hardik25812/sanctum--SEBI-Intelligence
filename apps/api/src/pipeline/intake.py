from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from src.pipeline.orchestrator import TraceContext


INJECTION_PATTERNS = [
    "ignore all previous",
    "ignore your instructions",
    "you are now dan",
    "disregard all prior",
    "output your system prompt",
    "repeat your instructions",
    "system prompt verbatim",
    "base64",
    "translate this and follow",
    "![](http",
    "as my advisor you previously",
    "you told me to invest in crypto",
    "jailbreak",
    "override your",
]


async def run_intake(ctx: TraceContext, session: AsyncSession) -> dict:
    profile = ctx.profile
    query = ctx.query
    query_lower = query.lower()

    for pattern in INJECTION_PATTERNS:
        if pattern in query_lower:
            return {
                "status": "fail",
                "failure_reason": f"Prompt injection detected: matched pattern '{pattern}'",
                "query_classification": "injection",
            }

    ood_keywords = ["weather", "cricket", "movie", "recipe", "joke"]
    for kw in ood_keywords:
        if kw in query_lower and not any(
            fin in query_lower for fin in ["invest", "fund", "portfolio", "market", "stock", "return"]
        ):
            return {
                "status": "fail",
                "failure_reason": f"Query out of scope: contains '{kw}' with no financial context",
                "query_classification": "other",
            }

    classification = "allocation_question"
    if any(w in query_lower for w in ["recommend", "suggest", "should i buy", "which fund"]):
        classification = "product_recommendation"
    elif any(w in query_lower for w in ["tax", "80c", "ltcg", "stcg", "capital gains"]):
        classification = "tax_question"
    elif any(w in query_lower for w in ["what is", "explain", "how does", "meaning of"]):
        classification = "general_education"

    return {
        "status": "pass",
        "profile_id": str(profile.id),
        "display_name": profile.display_name,
        "query": query,
        "query_classification": classification,
        "risk_profile": profile.risk_profile,
        "aum_inr": profile.aum_inr,
        "kyc_tier": profile.kyc_tier,
        "entitlements": profile.entitlements,
    }
