from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.gateway.model_gateway import gateway


async def retrieve_chunks(session: AsyncSession, query: str, top_k: int = 3) -> list[dict]:
    embedding = await gateway.embed(query)
    result = await session.execute(
        text("""
            SELECT sc.id, sc.content, s.doc_id, s.title, s.authority,
                   sc.embedding <=> :emb::vector AS distance
            FROM source_chunks sc
            JOIN sources s ON s.id = sc.source_id
            ORDER BY sc.embedding <=> :emb::vector
            LIMIT :k
        """).bindparams(emb=str(embedding), k=top_k)
    )
    rows = result.fetchall()
    return [
        {
            "chunk_id": str(r[0]),
            "content": r[1],
            "doc_id": r[2],
            "title": r[3],
            "authority": r[4],
            "distance": float(r[5]),
        }
        for r in rows
    ]


async def verify_claim(claim: str, chunks: list[dict]) -> dict:
    context = "\n\n".join(
        f"[{c['authority']}] {c['doc_id']} — {c['title']}:\n{c['content']}"
        for c in chunks
    )

    prompt = (
        f"You are a fact-checking assistant for SEBI-regulated financial advice.\n\n"
        f"CLAIM: {claim}\n\n"
        f"SOURCE DOCUMENTS:\n{context}\n\n"
        f"Does the source material support this claim? "
        f"Reply with exactly one of: YES, NO, PARTIAL\n"
        f"Then on the next line, explain in one sentence."
    )

    response = await gateway.call_cheap(prompt)
    first_line = response.strip().split("\n")[0].strip().upper()

    if "YES" in first_line:
        verdict = "yes"
    elif "PARTIAL" in first_line:
        verdict = "partial"
    else:
        verdict = "no"

    return {
        "claim": claim,
        "verdict": verdict,
        "grounded": verdict in ("yes", "partial"),
        "explanation": response.strip(),
        "sources_checked": len(chunks),
    }
