from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from src.pipeline.orchestrator import TraceContext


REJECT_PATTERNS = [
    ("crypto_primary", lambda p, q: "crypto" in q.lower() and any(
        w in q.lower() for w in ["primary", "only", "all in", "100%", "entire"]
    )),
    ("fo_leveraged", lambda p, q: any(
        w in q.lower() for w in ["f&o", "futures", "options", "leverage", "margin"]
    ) and any(w in q.lower() for w in ["leverage", "margin", "borrow", "2x", "3x", "5x"])),
    ("nri_single_asset_re", lambda p, q: (
        p.get("kyc_tier") == "tier_3"
        and "real estate" in q.lower()
        and any(w in q.lower() for w in ["single", "only", "one property"])
    )),
    ("single_name_concentration", lambda p, q: (
        p.get("business_risk", {}).get("concentration_pct", 0) > 50
    )),
    ("retired_low_aum", lambda p, q: (
        p.get("risk_profile") == "conservative"
        and p.get("aum_inr", 0) < 200_000_00
        and any(w in q.lower() for w in ["retire", "pension", "senior"])
    )),
]

OOD_THRESHOLD = 0.40


async def run_distribution(ctx: TraceContext, session: AsyncSession) -> dict:
    profile = ctx.profile
    query = ctx.query

    profile_dict = {
        "risk_profile": profile.risk_profile,
        "aum_inr": profile.aum_inr,
        "kyc_tier": profile.kyc_tier,
        "entitlements": profile.entitlements,
        "business_risk": profile.business_risk,
        "income_risk": profile.income_risk,
        "balance_sheet": profile.balance_sheet,
    }

    ood_score = 0.0
    triggered = []

    for pattern_name, check_fn in REJECT_PATTERNS:
        try:
            if check_fn(profile_dict, query):
                ood_score += 0.25
                triggered.append(pattern_name)
        except Exception:
            pass

    aum = profile.aum_inr
    if aum < 2_00_00_000 or aum > 50_00_00_00_000:
        ood_score += 0.15

    ood_score = min(ood_score, 1.0)
    in_distribution = ood_score <= OOD_THRESHOLD

    if not in_distribution:
        return {
            "status": "fail",
            "failure_reason": f"Out of distribution (score={ood_score:.2f}, triggers={triggered})",
            "ood_score": ood_score,
            "in_distribution": False,
            "served_population_match": False,
            "triggered_patterns": triggered,
        }

    return {
        "status": "pass",
        "ood_score": ood_score,
        "in_distribution": True,
        "served_population_match": True,
        "triggered_patterns": triggered,
    }
