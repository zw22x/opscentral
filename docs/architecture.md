# Architecture Overview

## Core Services

1. `apps/api`
   - Handles ingestion APIs, entity APIs, permissions, and audit events.
2. `apps/web`
   - Investigation UI for searching, filtering, and inspecting entities.
3. `infra`
   - Local service dependencies (Postgres, Redis).

## Data Flow (MVP)

1. Source data enters through API endpoints (later: scheduled ingestors).
2. Data is validated and transformed into domain entities.
3. Entities are stored and indexed.
4. Web app queries API for search + detail views.

## Domain Model (Initial)

1. `Entity`: core object (person, organization, asset, event).
2. `Relationship`: edge between entities with type and confidence.
3. `SourceRecord`: provenance object for traceability.

## Production Concepts To Learn

1. API contracts and versioning (`/api/v1`)
2. Database migrations and rollback strategy
3. Idempotent pipeline design
4. Observability:
   - structured logs
   - metrics
   - traces
5. Security:
   - authn (who are you)
   - authz (what can you do)
   - auditability (who did what and when)

