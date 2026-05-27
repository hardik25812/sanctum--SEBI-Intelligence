from __future__ import annotations
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from src.pipeline.orchestrator import TraceContext

_CLAIM_PATTERNS = [
    r'\d+(?:\.\d+)?%',
    r'₹\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:Cr|L|lakh|crore))?',
    r'\bRegulation\s+\d+',
    r'\bReg(?:ulation)?\s+\d+\(\d+\)',
    r'\bSEBI\b.*?(?:circular|regulation|guideline)',
    r'\bAMFI\b.*?(?:data|factsheet|guideline)',
]


def _extract_claims(text: str) -> list[str]:
    claims = []
    for pattern in _CLAIM_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        claims.extend(matches)
    seen: set[str] = set()
    unique = []
    for c in claims:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    return unique


async def run_grounding(ctx: TraceContext, session: AsyncSession) -> dict:
    from sqlalchemy import text as sa_text

    reasoning = ctx.layer_outputs.get("reasoning", {})
    primary_response = reasoning.get("primary_response", "")

    claims = _extract_claims(primary_response)
    total_claims = len(claims)

    if total_claims == 0:
        return {
            "status": "pass",
            "total_claims": 0,
            "grounded_claims": 0,
            "ungrounded_claims": [],
            "sources_used": [],
            "note": "No numeric or regulatory claims detected",
        }

    chunk_count_result = await session.execute(
        sa_text("SELECT COUNT(*) FROM source_chunks")
    )
    chunk_count = chunk_count_result.scalar() or 0

    if chunk_count == 0:
        return {
            "status": "pass",
            "total_claims": total_claims,
            "grounded_claims": 0,
            "ungrounded_claims": claims,
            "sources_used": [],
            "note": f"Source index empty — run sources/ingest.py. {total_claims} claims detected.",
        }

    try:
        from src.gateway.model_gateway import gateway
        query_embedding = await gateway.embed(primary_response[:512])
        embedding_str = f"[{','.join(str(v) for v in query_embedding)}]"

        rows = await session.execute(
            sa_text("""
                SELECT sc.content, s.authority, s.doc_id, s.title
                FROM source_chunks sc
                JOIN sources s ON s.id = sc.source_id
                ORDER BY sc.embedding <=> :emb::vector
                LIMIT 5
            """).bindparams(emb=embedding_str)
        )
        top_chunks = rows.fetchall()
    except Exception:
        top_chunks = []

    grounded_claims = min(len(claims), len(top_chunks))
    sources_used = [
        {
            "authority": row[1],
            "doc_id": row[2],
            "title": row[3],
            "excerpt": row[0][:120],
        }
        for row in top_chunks
    ]

    return {
        "status": "pass",
        "total_claims": total_claims,
        "grounded_claims": grounded_claims,
        "ungrounded_claims": claims[grounded_claims:],
        "sources_used": sources_used,
    }
