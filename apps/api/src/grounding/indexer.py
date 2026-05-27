import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.models.source import Source, SourceChunk
from src.gateway.model_gateway import gateway


def chunk_text(content: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = content.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap
    return chunks


async def ingest_source(
    session: AsyncSession,
    authority: str,
    doc_type: str,
    doc_id: str,
    title: str,
    content: str,
    url: str | None = None,
    published_date=None,
) -> Source:
    source = Source(
        id=uuid.uuid4(),
        authority=authority,
        doc_type=doc_type,
        doc_id=doc_id,
        title=title,
        url=url,
        content=content,
        published_date=published_date,
    )
    session.add(source)

    chunks = chunk_text(content)
    for idx, chunk_content in enumerate(chunks):
        embedding = await gateway.embed(chunk_content)
        chunk = SourceChunk(
            id=uuid.uuid4(),
            source_id=source.id,
            chunk_index=idx,
            content=chunk_content,
        )
        session.add(chunk)
        await session.flush()
        await session.execute(
            text(
                "UPDATE source_chunks SET embedding = :emb WHERE id = :cid"
            ).bindparams(emb=str(embedding), cid=str(chunk.id))
        )

    await session.commit()
    return source
