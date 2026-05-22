# OpsCentral — Phase 2: Ingestion Pipeline + API

## What we built

Phase 2 is where the backend comes alive. We went from a database with tables to a fully working REST API that can receive data, store it, and serve it back with filtering and search. By the end of Phase 2 you have:

- A FastAPI application with 6 working routes
- An ingestion pipeline that accepts records from any source and writes them to the database
- Search and filter on entities by name and type
- A clean separation between API layer, pipeline logic, and database models

---

## Core concepts

### FastAPI

FastAPI is a modern Python web framework for building APIs. It's built on top of Starlette (the HTTP layer) and Pydantic (the data validation layer). Two things make it stand out:

**Automatic validation** — you define what a request body should look like using a Pydantic model, and FastAPI automatically rejects any request that doesn't match. You never write `if "source_name" not in body` manually.

**Automatic docs** — FastAPI generates an interactive API documentation page at `/docs` for free. Every route you write shows up there with its inputs, outputs, and a "try it" button. This is huge for portfolio projects — interviewers can explore your API without writing a single curl command.

---

### Pydantic models vs SQLAlchemy models

This is a distinction that trips up a lot of people early on.

**SQLAlchemy models** (`models/entities.py`) define your database tables. They map Python classes to rows in PostgreSQL. They know about columns, foreign keys, and relationships. They are the source of truth for your data structure.

**Pydantic models** (`main.py` — the `IngestRequest`, `AlertCreate` classes) define the shape of your API requests and responses. They validate incoming JSON, convert types, and give you clean Python objects to work with. They have nothing to do with the database directly.

The flow is:
```
HTTP request → Pydantic validates → your route function → SQLAlchemy writes to DB
DB query → SQLAlchemy returns objects → your route function serializes → HTTP response
```

You serialize manually in Phase 2 (building the response dict by hand). In a larger project you'd use Pydantic response models to do this automatically, but doing it manually first teaches you exactly what's happening.

---

### Dependency injection with `Depends`

Look at every route signature:

```python
def list_entities(db: Session = Depends(get_db)):
```

`Depends(get_db)` is FastAPI's dependency injection system. When a request comes in, FastAPI calls `get_db()` for you, gets a database session, passes it into your function, and then closes it when the function returns — even if it crashes. You never open or close sessions manually.

This is a very common pattern in production FastAPI apps. The `get_db` function in `models/base.py` uses a Python generator (`yield`) to hand the session to the route and then clean it up afterward:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db      # hands the session to the route
    finally:
        db.close()    # always runs, even on exceptions
```

---

### CORS middleware

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    ...
)
```

CORS (Cross-Origin Resource Sharing) is a browser security feature. When your Next.js frontend at `localhost:3000` tries to call your API at `localhost:8000`, the browser blocks it by default because they're on different ports (different "origins"). The CORS middleware tells the browser "yes, requests from localhost:3000 are allowed."

Without this, your frontend would work fine in curl but completely fail in the browser.

---

### The ingestion pipeline

We separated ingestion logic into `pipelines/ingest.py` instead of putting it all in `main.py`. This is important — it means your routes stay thin and readable, and the actual business logic lives in a testable, reusable place.

The pipeline does two things:

**`get_or_create_source`** — looks up a source by name, creates it if it doesn't exist yet. This is an "upsert" pattern. The first time you ingest from "SEC EDGAR" it creates the source record. Every subsequent call finds the existing one. Your ingestion jobs always have a valid source to link to.

**`run_ingestion_job`** — creates an `IngestionJob` record first (status: "running"), then loops through the records and inserts each one as an `Entity`. If anything fails, it rolls back the whole batch and marks the job as "failed". If it succeeds, it marks the job "completed" and records how many records were inserted.

The job log is valuable — it gives you a history of every ingest run, when it happened, how many records came in, and whether it succeeded. That's what the `/jobs` route exposes.

---

### Query parameters and filtering

```python
@app.get("/entities")
def list_entities(
    skip: int = 0,
    limit: int = 50,
    entity_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
```

FastAPI automatically reads `skip`, `limit`, `entity_type`, and `search` from the URL query string. So `GET /entities?search=Raytheon&entity_type=company` just works — no parsing needed.

The `ilike` filter is PostgreSQL's case-insensitive LIKE:

```python
query = query.filter(Entity.name.ilike(f"%{search}%"))
```

The `%` wildcards mean "anything before or after the search term." So searching "lock" matches "Lockheed Martin Corp".

`skip` and `limit` are pagination — `skip=0&limit=50` gives you the first page, `skip=50&limit=50` gives you the second, and so on. The frontend will use this later.

---

### The `metadata_` naming issue

SQLAlchemy's `DeclarativeBase` uses an attribute called `metadata` internally to store table schema information. If you name a column `metadata` on your model, SQLAlchemy throws `InvalidRequestError: Attribute name 'metadata' is reserved`.

The fix is to name the Python attribute `metadata_` (with an underscore) while keeping the actual database column named `metadata`:

```python
metadata_ = Column("metadata", JSON, default=dict)
```

The string `"metadata"` is the actual column name in PostgreSQL. `metadata_` is just what you call it in Python. This is a SQLAlchemy-specific quirk worth remembering.

---

## File structure after Phase 2

```
palantir/
├── docker-compose.yml
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    ├── alembic.ini
    ├── alembic/
    ├── models/
    │   ├── __init__.py
    │   ├── base.py
    │   └── entities.py
    ├── pipelines/
    │   ├── __init__.py
    │   └── ingest.py          ← new
    ├── utils/
    │   └── __init__.py        ← new
    └── connector-service/
        └── main.py            ← fully rewritten
```

---

## API routes reference

| Method | Route | What it does |
|---|---|---|
| GET | `/health` | Returns `{"status": "connected"}` — use this to verify the API is up |
| GET | `/entities` | List all entities. Supports `?search=`, `?entity_type=`, `?skip=`, `?limit=` |
| GET | `/entities/{id}` | Get a single entity by UUID, including its alerts |
| POST | `/ingest` | Ingest a batch of records from a named source |
| GET | `/jobs` | List the last 20 ingestion jobs with status and record counts |
| GET | `/sources` | List all data sources |
| POST | `/alerts` | Create an alert on a specific entity |

---

## How to run

### Prerequisites
- Phase 1 complete (database running, tables migrated)
- Virtual environment active

### Start the API

```bash
cd /Users/williamwestbrook/palantir/backend
python3 -m uvicorn connector-service.main:app --reload --port 8000
```

The `--reload` flag watches for file changes and restarts automatically. Leave this running in a dedicated terminal tab.

### Verify it's up

```bash
curl http://localhost:8000/health
# → {"status":"connected"}
```

### Interactive docs

Open `http://localhost:8000/docs` in your browser. You'll see every route listed with full request/response schemas and a "Try it out" button. This is auto-generated by FastAPI — great to show in interviews.

### Seed the database

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "SEC EDGAR",
    "source_type": "api",
    "entity_type": "company",
    "records": [
      {"name": "Lockheed Martin Corp", "description": "Defense and aerospace manufacturer", "meta": {"ticker": "LMT", "country": "US"}},
      {"name": "Palantir Technologies", "description": "Data intelligence platform", "meta": {"ticker": "PLTR", "country": "US"}},
      {"name": "Booz Allen Hamilton", "description": "Government consulting and analytics", "meta": {"ticker": "BAH", "country": "US"}}
    ]
  }'
```

### Test filtering

```bash
# Search by name
curl "http://localhost:8000/entities?search=Palantir"

# Filter by type
curl "http://localhost:8000/entities?entity_type=company"

# Paginate
curl "http://localhost:8000/entities?skip=0&limit=5"
```

---

## Common issues

**`get_or_create_source() missing 1 required positional argument: 'base_url'`**
The `base_url` parameter needs a default value of `None`. Make sure the signature reads `base_url: str = None` not `base_url: str`.

**`'description' is an invalid keyword argument for Entity`**
Typo in `ingest.py` — check the spelling of every keyword argument passed to `Entity(...)`.

**Ingest returns `status: failed`, records_ingested: 0**
The exception is being swallowed silently. Add `print(f"Ingest error: {e}")` inside the except block to surface the real error.

**`metadata` field always returns `{}`**
The ingest payload key must match what `ingest.py` is reading. The curl payload uses `"meta"` as the key, so `ingest.py` must call `record.get("meta", {})` not `record.get("metadata", {})`.

**CORS errors in the browser**
Make sure `allow_origins` in `main.py` includes the exact origin your frontend runs on, including the port. `http://localhost:3000` and `http://127.0.0.1:3000` are treated as different origins.