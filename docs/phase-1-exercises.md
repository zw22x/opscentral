# Phase 1 Exercises (Write This Code Next)

This file is your active implementation checklist.

## Exercise 1: Implement Entity Detail Endpoint

Goal:

Add `GET /api/v1/entities/{entity_id}` in the API.

What you should practice:

1. Path params + validation
2. 404 behavior and error response shape
3. Pydantic response models

Definition of done:

1. Existing entities return `200`
2. Unknown ids return `404`
3. Tests cover both cases

## Exercise 2: Add Pagination + Search

Goal:

Support `limit`, `offset`, and `q` query parameters on `GET /api/v1/entities`.

What you should practice:

1. Query params with sane defaults
2. Filtering logic
3. Consistent response envelope

Definition of done:

1. Query returns stable paged results
2. Search matches `name` and `description`
3. Tests verify edge cases (`limit=0`, large offset)

## Exercise 3: Frontend Entity Table

Goal:

Build a table in `apps/web/app/page.tsx` with:

1. Search input
2. Loading state
3. Error state
4. Empty state

Definition of done:

1. Table renders entity list from API
2. Search updates results
3. UI handles API failure gracefully

## Exercise 4: Promote to Postgres

Goal:

Replace in-memory `ENTITIES` data with Postgres-backed queries.

What you should practice:

1. SQLAlchemy models
2. Repository/service layer split
3. Integration tests with real DB

Definition of done:

1. No in-memory entity store remains
2. API behavior unchanged for clients
3. Migration creates needed schema

