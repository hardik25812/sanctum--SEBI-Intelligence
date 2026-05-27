# Sanctum — Decision Log

Every non-obvious architectural or product decision is logged here with rationale.

---

## D-001: Tailwind CSS v4 with PostCSS

**Date**: 2025-05-28
**Decision**: Use Tailwind CSS v4 (CSS-first configuration) instead of v3.
**Rationale**: Spec locks Tailwind v4. v4 uses `@import "tailwindcss"` in CSS and `@theme` blocks instead of `tailwind.config.ts` for token definitions. We keep a `tailwind.config.ts` only for content paths if needed.

## D-002: SQLAlchemy for writes, Prisma deferred

**Date**: 2025-05-28
**Decision**: SQLAlchemy 2.0 async handles all DB operations in v1. Prisma integration for frontend reads deferred to v2.
**Rationale**: Adding both ORMs in v1 doubles the migration surface. The Next.js frontend fetches data via the FastAPI REST layer, not directly from Postgres. Prisma adds value only when we want type-safe DB queries from the frontend, which is a v2 concern.

## D-003: Eval case counts

**Date**: 2025-05-28
**Decision**: Target all 469 cases as specified. Cases that are genuinely too hard for v1 are marked `severity: aspirational` but never deleted.
**Rationale**: Spec section 11 is explicit — do not delete hard cases.
