"""Source document ingestion — chunks and embeds SEBI/AMFI/RBI documents into pgvector."""
import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "api"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://sanctum:sanctum@localhost:5432/sanctum")


async def ingest_directory(session: AsyncSession, directory: Path, authority: str):
    from src.grounding.indexer import ingest_source

    for filepath in sorted(directory.glob("*.txt")):
        print(f"  Ingesting {filepath.name}...")
        content = filepath.read_text(encoding="utf-8")
        doc_id = filepath.stem
        title = doc_id.replace("_", " ").title()
        await ingest_source(
            session=session,
            authority=authority,
            doc_type="regulation" if "reg" in doc_id.lower() else "circular",
            doc_id=doc_id,
            title=title,
            content=content,
            url=None,
        )


async def main():
    engine = create_async_engine(DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    sources_dir = Path(__file__).parent

    async with session_factory() as session:
        sebi_dir = sources_dir / "sebi"
        if sebi_dir.exists():
            print("Ingesting SEBI documents...")
            await ingest_directory(session, sebi_dir, "sebi")

        amfi_dir = sources_dir / "amfi"
        if amfi_dir.exists():
            print("Ingesting AMFI documents...")
            await ingest_directory(session, amfi_dir, "amfi")

        rbi_dir = sources_dir / "rbi"
        if rbi_dir.exists():
            print("Ingesting RBI documents...")
            await ingest_directory(session, rbi_dir, "rbi")

    await engine.dispose()
    print("Ingestion complete.")


if __name__ == "__main__":
    asyncio.run(main())
