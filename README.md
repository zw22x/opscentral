# Palantir-Style Intelligence Platform (Learning Build)

This repository is a guided, production-style project to help you learn how real data platforms are built.

## What We Are Building

An operational intelligence platform with:

- Multi-source data ingestion
- Entity and relationship modeling
- Search and investigation workflows
- Governance (auth, permissions, audit trails)
- Production-grade deployment and observability

## Monorepo Structure

```text
apps/
  api/        FastAPI service (data access, APIs, business logic)
  web/        Next.js app (investigation and analytics UI)
docs/         Study path, architecture, exercises
infra/        Local infrastructure (Postgres, Redis, etc.)
```

## Phase Plan

1. Phase 1: Foundation (health checks, entity APIs, basic UI)
2. Phase 2: Real persistence + pipeline orchestration
3. Phase 3: Investigation workflows + alerts
4. Phase 4: Production hardening (CI/CD, observability, security)

## Getting Started (Local)

1. Start local infra:
   - `docker compose -f infra/docker-compose.yml up -d`
2. Start API:
   - `cd apps/api`
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -e ".[dev]"`
   - `uvicorn app.main:app --reload --port 8000`
3. Start web:
   - `cd apps/web`
   - `npm install`
   - `npm run dev`

## What To Study First

Read in this order:

1. `docs/study-plan.md`
2. `docs/architecture.md`
3. `docs/phase-1-exercises.md`

