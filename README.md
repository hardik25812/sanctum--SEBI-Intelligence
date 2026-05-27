# Sanctum

**A safety harness for the AI surfaces of regulated wealth.**

Sanctum is a six-layer compliance pipeline for SEBI-regulated wealth advisory AI output. Every recommendation an Optima client sees must be *grounded*, *compliant*, and *auditable* — before it reaches them, not after.

## Architecture

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend**: FastAPI (Python 3.11+) with SQLAlchemy 2.0
- **Database**: PostgreSQL 16 + pgvector
- **Models**: Anthropic (`claude-opus-4-5`) + OpenAI (`gpt-4o`) behind a unified `ModelGateway`
- **Eval harness**: 469 YAML test cases across 7 adversarial suites

## Quick Start (5 minutes)

### Prerequisites

- Node.js 20+, pnpm 9+
- Python 3.11+, uv
- Docker + Docker Compose

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USER/sanctum.git
cd sanctum
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and OPENAI_API_KEY in .env
pnpm install
```

### 2. Start Postgres

```bash
docker compose up -d
```

### 3. Run migrations

```bash
cd apps/api
uv sync
uv run alembic upgrade head
```

### 4. Seed data

```bash
uv run python ../../scripts/seed.py
```

### 5. Ingest source documents

```bash
uv run python ../../sources/ingest.py
```

### 6. Start the API

```bash
uv run uvicorn src.main:app --reload --port 8000
```

### 7. Start the dashboard

```bash
cd ../../apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the Sanctum dashboard.

## Eval Suite

```bash
cd evals
python runner.py --suite all --commit $(git rev-parse HEAD)
```

Exit code is non-zero if any critical case fails.

## Project Structure

```
sanctum/
├── apps/web/          # Next.js dashboard
├── apps/api/          # FastAPI pipeline service
├── packages/shared-types/
├── evals/             # 469 YAML adversarial test cases
├── sources/           # SEBI/AMFI/RBI primary source corpus
└── scripts/           # seed, reset, eval runner
```

## License

Private. All rights reserved.
