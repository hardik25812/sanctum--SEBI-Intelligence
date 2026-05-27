"""Verify the audit_log hash chain end-to-end."""
import asyncio
import hashlib
import json

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

DATABASE_URL = "postgresql+asyncpg://sanctum:sanctum@localhost:5432/sanctum"


async def verify():
    engine = create_async_engine(DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession)

    async with session_factory() as session:
        result = await session.execute(
            text("SELECT id, trace_id, event_type, prev_hash, row_hash, payload, created_at FROM audit_log ORDER BY id ASC")
        )
        rows = result.fetchall()

        if not rows:
            print("No audit rows found.")
            return

        print(f"Verifying {len(rows)} audit rows...")
        expected_prev = "0" * 64

        for row in rows:
            row_id, trace_id, event_type, prev_hash, row_hash, payload, created_at = row

            if prev_hash != expected_prev:
                print(f"CHAIN BROKEN at row {row_id}: expected prev_hash={expected_prev[:16]}..., got {prev_hash[:16]}...")
                exit(1)

            raw = f"{prev_hash}{trace_id}{event_type}{json.dumps(payload, default=str)}{created_at.isoformat()}"
            computed = hashlib.sha256(raw.encode()).hexdigest()

            if computed != row_hash:
                print(f"HASH MISMATCH at row {row_id}: computed={computed[:16]}..., stored={row_hash[:16]}...")
                exit(1)

            expected_prev = row_hash

        print(f"Chain verified: {len(rows)} rows, all hashes valid.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(verify())
