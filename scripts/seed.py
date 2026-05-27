"""Seed script — populates client_profiles with realistic test data."""
import asyncio
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker


DATABASE_URL = "postgresql+asyncpg://sanctum:sanctum@localhost:5432/sanctum"

SEED_PROFILES = [
    {
        "id": "00000000-0000-0000-0000-000000000001",
        "display_name": "HNI-0418",
        "aum_inr": 12_40_00_000,
        "business_risk": {"sector": "Logistics", "concentration_pct": 35, "cyclicality": "moderate"},
        "income_risk": {"sources": ["business", "rental"], "primary_pct": 80, "stability": "moderate"},
        "balance_sheet": {"liquid_pct": 40, "illiquid_pct": 55, "debt_ratio": 0.3},
        "risk_profile": "moderate",
        "kyc_tier": "tier_1",
        "entitlements": ["equity", "mf", "aif_cat_3", "bonds"],
    },
    {
        "id": "00000000-0000-0000-0000-000000000002",
        "display_name": "HNI-0722",
        "aum_inr": 8_50_00_000,
        "business_risk": {"sector": "Technology", "concentration_pct": 20, "cyclicality": "high"},
        "income_risk": {"sources": ["salary", "equity_grants"], "primary_pct": 70, "stability": "high"},
        "balance_sheet": {"liquid_pct": 60, "illiquid_pct": 30, "debt_ratio": 0.1},
        "risk_profile": "aggressive",
        "kyc_tier": "tier_1",
        "entitlements": ["equity", "mf", "aif_cat_3", "bonds", "derivatives"],
    },
    {
        "id": "00000000-0000-0000-0000-000000000003",
        "display_name": "HNI-1103",
        "aum_inr": 25_00_00_000,
        "business_risk": {"sector": "Pharmaceuticals", "concentration_pct": 45, "cyclicality": "low"},
        "income_risk": {"sources": ["business", "dividends"], "primary_pct": 90, "stability": "high"},
        "balance_sheet": {"liquid_pct": 30, "illiquid_pct": 60, "debt_ratio": 0.2},
        "risk_profile": "conservative",
        "kyc_tier": "tier_2",
        "entitlements": ["equity", "mf", "bonds", "fd"],
    },
    {
        "id": "00000000-0000-0000-0000-000000000004",
        "display_name": "HNI-0915",
        "aum_inr": 5_00_00_000,
        "business_risk": {"sector": "Real Estate", "concentration_pct": 60, "cyclicality": "high"},
        "income_risk": {"sources": ["rental", "business"], "primary_pct": 85, "stability": "low"},
        "balance_sheet": {"liquid_pct": 15, "illiquid_pct": 80, "debt_ratio": 0.5},
        "risk_profile": "moderate",
        "kyc_tier": "tier_1",
        "entitlements": ["equity", "mf", "bonds"],
    },
    {
        "id": "00000000-0000-0000-0000-000000000005",
        "display_name": "HNI-0201",
        "aum_inr": 45_00_00_000,
        "business_risk": {"sector": "FMCG", "concentration_pct": 15, "cyclicality": "low"},
        "income_risk": {"sources": ["business", "rental", "dividends"], "primary_pct": 60, "stability": "high"},
        "balance_sheet": {"liquid_pct": 50, "illiquid_pct": 40, "debt_ratio": 0.1},
        "risk_profile": "moderate",
        "kyc_tier": "tier_1",
        "entitlements": ["equity", "mf", "aif_cat_3", "bonds", "pms"],
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=True)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        for profile in SEED_PROFILES:
            existing = await session.execute(
                text("SELECT id FROM client_profiles WHERE id = :id"),
                {"id": profile["id"]},
            )
            if existing.scalar_one_or_none():
                print(f"  Profile {profile['display_name']} already exists, skipping.")
                continue

            import json
            await session.execute(
                text("""
                    INSERT INTO client_profiles (id, display_name, aum_inr, business_risk, income_risk, balance_sheet, risk_profile, kyc_tier, entitlements)
                    VALUES (:id, :display_name, :aum_inr, CAST(:business_risk AS jsonb), CAST(:income_risk AS jsonb), CAST(:balance_sheet AS jsonb), :risk_profile, :kyc_tier, :entitlements)
                """),
                {
                    "id": profile["id"],
                    "display_name": profile["display_name"],
                    "aum_inr": profile["aum_inr"],
                    "business_risk": json.dumps(profile["business_risk"]),
                    "income_risk": json.dumps(profile["income_risk"]),
                    "balance_sheet": json.dumps(profile["balance_sheet"]),
                    "risk_profile": profile["risk_profile"],
                    "kyc_tier": profile["kyc_tier"],
                    "entitlements": profile["entitlements"],
                },
            )
            print(f"  Seeded {profile['display_name']}")

        genesis = await session.execute(text("SELECT id FROM audit_log WHERE id = 1"))
        if not genesis.scalar_one_or_none():
            import hashlib, datetime, json as json_mod
            now = datetime.datetime.now(datetime.timezone.utc)
            prev_hash = "0" * 64
            trace_id = "00000000-0000-0000-0000-000000000000"
            event_type = "genesis"
            payload = json_mod.dumps({"event": "system_init"})
            raw = f"{prev_hash}{trace_id}{event_type}{payload}{now.isoformat()}"
            row_hash = hashlib.sha256(raw.encode()).hexdigest()

            await session.execute(
                text("""
                    INSERT INTO audit_log (trace_id, event_type, prev_hash, row_hash, payload, created_at)
                    VALUES (:trace_id, :event_type, :prev_hash, :row_hash, CAST(:payload AS jsonb), :created_at)
                """),
                {
                    "trace_id": trace_id,
                    "event_type": event_type,
                    "prev_hash": prev_hash,
                    "row_hash": row_hash,
                    "payload": payload,
                    "created_at": now,
                },
            )
            print("  Seeded genesis audit row.")

        await session.commit()
        print("Seed complete.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
