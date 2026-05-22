# OpsCentral — Phase 1: Backend Foundation

## What we built

Phase 1 is the foundation everything else sits on. No frontend, no API logic yet — just the database layer wired up correctly so every future phase has a solid place to read and write data.

By the end of Phase 1 you have:
- A PostgreSQL database running in Docker
- 6 tables created and managed by Alembic migrations
- SQLAlchemy models that map Python classes to those tables
- A clean separation between DB connection logic and table definitions

---

## Core concepts

### Docker and docker-compose

Docker lets you run a PostgreSQL database in an isolated container instead of installing it directly on your Mac. This means the database setup is reproducible — anyone who clones your repo can run `docker compose up` and get the exact same environment.

`docker-compose.yml` is the config file that defines your services. In Phase 1 we defined two services:

- `postgres` — the database container. It uses the official postgres:15 image and creates a database called `opscentral` with user `ops` and password `ops`.
- `backend` — the FastAPI app container. We don't use this yet but it's wired up for Phase 2.

The `volumes` section at the bottom (`pgdata`) tells Docker to persist your database data to disk. Without it, every time you stopped the container your data would be wiped.

**Why port 5433?** Your Mac already had a local PostgreSQL installation running on the default port 5432, so we mapped Docker's postgres to 5433 to avoid the conflict. Docker's internal port is still 5432 — the `5433:5432` mapping means "expose Docker's 5432 as 5433 on the host machine."

---

### SQLAlchemy

SQLAlchemy is Python's most widely used ORM (Object Relational Mapper). An ORM lets you interact with your database using Python classes and objects instead of writing raw SQL.

We split the SQLAlchemy setup into two files:

**`models/base.py`** — the connection layer. This file does three things:
1. Reads the `DATABASE_URL` environment variable to know where the database is
2. Creates the `engine` — the actual connection pool to PostgreSQL
3. Defines `Base` — the parent class that all your models inherit from
4. Defines `get_db` — a FastAPI dependency that opens and closes a session per request

**`models/entities.py`** — the table definitions. Each class that inherits from `Base` becomes a table. Each `Column(...)` becomes a column in that table.

The reason we separate these two files is that `base.py` never needs to change — it's pure infrastructure. `entities.py` changes every time you add or modify a table.

---

### The 6 tables

| Table | Purpose |
|---|---|
| `entities` | The core object — a company, person, vessel, IP address, or aircraft |
| `sources` | Where data came from — OpenSky, SEC EDGAR, OFAC, etc. |
| `ingestion_jobs` | A log of every ingest run — when it ran, how many records, whether it succeeded |
| `alerts` | Flags on entities — sanctions hits, anomalies, high-risk signals |
| `entity_relationships` | Links between two entities — "Company A owns Vessel B" |
| `entity_sources` | Junction table linking an entity to the source it came from, storing the raw data |

Every table uses a **UUID primary key** instead of an auto-incrementing integer. UUIDs are better for distributed systems because they can be generated anywhere without coordinating with the database, and they don't leak information about how many records you have.

---

### Alembic migrations

Alembic is the migration tool for SQLAlchemy. A migration is a versioned script that describes a change to your database schema.

**Why not just call `Base.metadata.create_all(engine)`?**

`create_all` creates tables but never modifies them. The moment you add a column to a model, `create_all` won't touch the existing table — your code and your database go out of sync. Alembic tracks every change as a numbered version, applies them in order, and lets you roll back.

The key files:

- `alembic.ini` — config file, tells Alembic where the database is and where the migration scripts live
- `alembic/env.py` — the environment script Alembic runs before generating migrations. We modified it to import our models so Alembic can compare them against the live database and detect what changed.
- `alembic/versions/` — each migration is a Python file here with an `upgrade()` and `downgrade()` function

**The two commands you'll use constantly:**

```bash
# Generate a new migration by comparing your models to the DB
python3 -m alembic revision --autogenerate -m "description of change"

# Apply all pending migrations
python3 -m alembic upgrade head
```

---

## File structure after Phase 1

```
palantir/
├── docker-compose.yml
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py
    │   └── versions/
    │       └── 3ff4e12c8720_initial_schema.py
    ├── models/
    │   ├── __init__.py
    │   ├── base.py
    │   └── entities.py
    ├── pipelines/         (empty, used in Phase 2)
    ├── utils/             (empty, used in Phase 2)
    └── connector-service/
        └── main.py        (stub, rewritten in Phase 2)
```

---

## Setup instructions (from scratch)

### Prerequisites
- Docker Desktop installed and running (whale icon in menu bar)
- Python 3.12 with a `.venv` virtual environment active
- Project cloned at `~/palantir/`

### Steps

**1. Start the database**
```bash
docker compose -f ~/palantir/docker-compose.yml up postgres -d
```

**2. Install dependencies**
```bash
cd ~/palantir/backend
pip install sqlalchemy psycopg2-binary alembic fastapi uvicorn
```

**3. Run migrations**
```bash
cd ~/palantir/backend
python3 -m alembic upgrade head
```

**4. Verify tables were created**
```bash
docker exec -it palantir-postgres-1 psql -U ops -d opscentral -c "\dt"
```

You should see 7 rows: `alembic_version` plus the 6 application tables.

### If you add or change a model

Any time you edit `models/entities.py` — add a column, rename something, add a new table — run:

```bash
python3 -m alembic revision --autogenerate -m "short description of what changed"
python3 -m alembic upgrade head
```

Never edit the generated migration files by hand unless you know exactly what you're doing.

---

## Common issues

**`role "ops" does not exist`**
Your local Mac postgres is intercepting the connection instead of Docker. Make sure the port in `alembic.ini` and `models/base.py` is `5433`, and that the Docker container is running (`docker ps`).

**`No module named 'psycopg2'`**
Alembic is running from system Python instead of your venv. Use `python3 -m alembic` instead of just `alembic`.

**`Attribute name 'metadata' is reserved`**
SQLAlchemy reserves the name `metadata` on all model classes. Name the column `meta` in Python instead.