#!/bin/bash
set -e

echo "Dropping and recreating sanctum database..."
docker compose exec postgres psql -U sanctum -c "DROP DATABASE IF EXISTS sanctum;"
docker compose exec postgres psql -U sanctum -c "CREATE DATABASE sanctum;"

echo "Running migrations..."
cd apps/api
uv run alembic upgrade head

echo "Seeding..."
cd ../..
uv run python scripts/seed.py

echo "Done."
