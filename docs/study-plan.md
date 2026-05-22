# Study Plan (12 Weeks)

## Weeks 1-2: Backend Fundamentals

Study:

1. Python typing, async basics, FastAPI routing
2. Pydantic models and validation
3. HTTP semantics (status codes, idempotency, pagination)

Build:

1. Health endpoint
2. Entity list/detail endpoints
3. Basic filtering + pagination

## Weeks 3-4: Data Modeling + SQL

Study:

1. PostgreSQL schema design
2. Indexing strategy
3. SQLAlchemy ORM and migrations (Alembic)

Build:

1. Persist entities in Postgres
2. Add migration workflow
3. Add integration tests for data queries

## Weeks 5-6: Frontend Investigation UI

Study:

1. Next.js app router
2. TypeScript typing patterns
3. React Query for server state

Build:

1. Entity table with filters
2. Detail panel
3. Loading/error/empty states

## Weeks 7-8: Pipelines + Async Jobs

Study:

1. Workflow orchestration basics
2. Queue semantics and retries
3. Data lineage and provenance

Build:

1. Ingestion job queue
2. Retry policy and dead-letter handling
3. Source-to-entity lineage metadata

## Weeks 9-10: Security + Governance

Study:

1. OAuth2/OIDC concepts
2. Role-based access control (RBAC)
3. Audit logging patterns

Build:

1. Protected endpoints
2. Role checks per endpoint
3. Immutable audit logs for data mutations

## Weeks 11-12: Production Readiness

Study:

1. CI/CD with GitHub Actions
2. Observability (logs, metrics, traces)
3. SLOs and incident response basics

Build:

1. CI pipeline with lint/test checks
2. Error monitoring integration
3. Basic runbook for common failures

