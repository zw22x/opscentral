# OpsCentral — Phase 3: Frontend

## What we built

Phase 3 is the entire frontend — a dark, Palantir-style data intelligence dashboard built in Next.js 15 with TypeScript and Tailwind. By the end of Phase 3 you have:

- A fully functional single-page dashboard that fetches live data from the FastAPI backend
- An entity table with real-time search and type filtering
- A Sources view and an Ingest Jobs view
- A sidebar with live stats (total entities, sources, records ingested, failed jobs)
- A click-through detail panel showing entity metadata and alerts

---

## Core concepts

### Next.js App Router

Next.js 15 uses the App Router by default. Every file inside `app/` that's named `page.tsx` becomes a route. `app/page.tsx` is the root route (`/`). `app/layout.tsx` wraps every page with shared structure — in our case just the HTML shell and global CSS.

The App Router introduced a distinction between **Server Components** and **Client Components**:

- **Server Components** run on the server, have no interactivity, and can't use `useState`, `useEffect`, or browser APIs. They're the default.
- **Client Components** run in the browser and can use React hooks and event handlers. You opt in with `"use client"` at the top of the file.

Our entire `page.tsx` is a Client Component because it needs `useState` for search/filter state, `useEffect` for data fetching, and `onClick` handlers for the entity rows. That's why the first line is `"use client"`.

---

### The API layer — `lib/api.ts`

We separated all API calls into a dedicated file instead of writing `fetch()` calls directly in the component. This is a clean architecture pattern — the component doesn't care how data is fetched, just what shape it comes back in.

The file does three things:
1. Defines TypeScript interfaces (`Entity`, `Alert`, `Source`, `IngestionJob`) that describe exactly what the API returns
2. Defines async functions (`fetchEntities`, `fetchEntity`, `fetchSources`, `fetchJobs`) that call the API and return typed data
3. Handles query string construction with `URLSearchParams` so the component just passes an object of filters

TypeScript interfaces are pure type information — they don't exist at runtime. They're just a contract that says "this object will have these fields of these types." If you try to access a field that doesn't exist on the interface, TypeScript catches it at compile time before the code ever runs.

---

### `useCallback` and `useEffect` for data fetching

```tsx
const loadEntities = useCallback(async () => {
    setLoading(true);
    const data = await fetchEntities({ search, entity_type: entityType });
    setEntities(data.entities);
    setTotal(data.total);
}, [search, entityType]);

useEffect(() => {
    loadEntities();
}, [loadEntities]);
```

**Why `useCallback`?** Without it, `loadEntities` would be a new function reference on every render, which would cause `useEffect` to run on every render (infinite loop). `useCallback` memoizes the function — it only creates a new reference when `search` or `entityType` changes.

**Why the dependency array?** The array `[search, entityType]` tells React "only re-run this when search or entityType changes." This is what makes the search live — every keystroke updates `search` state, which triggers `loadEntities` to re-run, which fetches new results.

---

### Inline styles vs Tailwind

We used inline styles (`style={{ ... }}`) instead of Tailwind classes for the main layout. This is intentional — our color system uses CSS custom properties (variables) defined in `globals.css`:

```css
:root {
  --background: #0a0e1a;
  --surface: #0f1629;
  --accent: #3b82f6;
  ...
}
```

Tailwind's JIT compiler generates classes at build time from a fixed palette. It can't generate classes for arbitrary CSS variables like `var(--surface-2)`. Inline styles can reference any CSS variable directly, which gives us a consistent, easily-tweakable design system without fighting Tailwind's constraints.

The tradeoff is verbosity — inline styles are more code. In a larger project you'd extend Tailwind's config to include your custom variables.

---

### The detail panel pattern

When a user clicks an entity row, two things happen:

1. `setSelectedEntity(null)` — clears the current panel immediately so there's no flash of stale data
2. `fetchEntity(entity.id)` — fetches the full entity including alerts
3. `setSelectedEntity(full)` — populates the panel with the new data

The panel is conditionally rendered at the bottom of the layout:

```tsx
{selectedEntity && (
  <aside>...</aside>
)}
```

When `selectedEntity` is `null` the panel doesn't exist in the DOM at all. When it's set, the panel appears on the right side. This is a common pattern for master-detail layouts — think Gmail's email preview pane.

---

### CORS — why the frontend can talk to the backend

The frontend runs on `localhost:3000` and the backend on `localhost:8000`. These are different origins (different ports = different origin). Browsers block cross-origin requests by default as a security measure.

We solved this in Phase 2 by adding CORS middleware to FastAPI:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    ...
)
```

This tells the browser "requests from localhost:3000 are allowed." Without this, every `fetch()` call in the frontend would silently fail with a CORS error in the browser console.

---

### The hydration mismatch warning

Next.js renders pages on the server first (SSR), then "hydrates" them on the client — attaching React's event handlers to the existing HTML. If the server-rendered HTML doesn't exactly match what React would render on the client, you get a hydration mismatch warning.

In our case this was caused by the **Grammarly browser extension** injecting `data-gr-ext-installed` attributes into the `<body>` tag. The server renders a clean body tag; Grammarly modifies it before React hydrates. This is a browser extension issue, not a code issue — it doesn't affect functionality at all.

---

## File structure after Phase 3

```
palantir/
└── frontend/
    ├── app/
    │   ├── globals.css      ← dark color system via CSS variables
    │   ├── layout.tsx       ← HTML shell, imports globals.css
    │   └── page.tsx         ← entire dashboard UI (~550 lines)
    ├── lib/
    │   └── api.ts           ← all API calls and TypeScript interfaces
    ├── package.json
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

## Component breakdown

| Component | What it does |
|---|---|
| Top bar | App name, entity/source count, refresh button |
| Sidebar | View switcher (Entities / Sources / Jobs), live stats |
| Toolbar | Search input, entity type filter dropdown, clear button |
| Entity table | Paginated list with icon, type badge, description, meta, date |
| Sources table | Lists all ingestion sources and last ingested time |
| Jobs table | Lists last 20 ingest jobs with status badge and duration |
| Detail panel | Slides in on entity click — shows details, metadata, and alerts |
| StatusBadge | Colored pill for job status (completed/running/failed) |
| SeverityDot | Colored dot for alert severity (low/medium/high/critical) |
| EntityIcon | Lucide icon matched to entity type |

---

## How to run

### Prerequisites
- Phase 1 complete (database running)
- Phase 2 complete (API running on port 8000)
- Node.js installed

### Start the frontend

```bash
cd /Users/williamwestbrook/palantir/frontend
npm run dev
```

Open `http://localhost:3000`.

### Full stack startup (all three services)

**Terminal 1 — database:**
```bash
docker compose -f /Users/williamwestbrook/palantir/docker-compose.yml up postgres -d
```

**Terminal 2 — backend:**
```bash
cd /Users/williamwestbrook/palantir/backend
source ../.venv/bin/activate
python3 -m uvicorn connector-service.main:app --reload --port 8000
```

**Terminal 3 — frontend:**
```bash
cd /Users/williamwestbrook/palantir/frontend
npm run dev
```

---

## Common issues

**Blank page / "Failed to fetch entities"**
The API isn't running or is on the wrong port. Make sure uvicorn is running on port 8000 and check that `API_BASE` in `lib/api.ts` is set to `http://localhost:8000` with backticks, not single quotes.

**Template literals not interpolating (`${API_BASE}` showing literally)**
The fetch URL strings must use backticks (`` ` ``), not single quotes (`'`) or double quotes (`"`). Backticks are what enable `${}` interpolation in JavaScript.

**Detail panel crashes on click**
The entity fetch returned an unexpected shape. Add `console.log` inside `handleEntityClick` after the fetch to inspect what came back before setting state.

**Hydration mismatch warning**
Almost always caused by a browser extension (Grammarly, LastPass, etc.) modifying the DOM before React hydrates. Harmless — disable the extension on localhost to make it disappear.

**Search not updating**
Make sure `loadEntities` is wrapped in `useCallback` with `[search, entityType]` as dependencies, and that the `useEffect` depends on `[loadEntities]`. If either dependency array is wrong the search won't re-trigger on input change.