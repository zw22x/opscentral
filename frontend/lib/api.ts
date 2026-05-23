const API_BASE = "http://localhost:8000";

export interface Entity {
    id: string;
    name: string;
    entity_type: string;
    description: string;
    meta: Record<string, unknown>;
    created_at: string;
    alerts?: Alert[];
}

export interface Alert {
    id: string;
    severity: string;
    title: string;
    description: string;
    resolved: string;
    created_at: string;
}

export interface Source {
    id: string;
    name: string;
    source_type: string;
    base_url: string | null;
    last_ingested_at: string | null;
}

export interface IngestionJob {
    id: string;
    status: string;
    records_ingested: string;
    started_at: string;
    finished_at: string | null;
}

export async function fetchEntities(params?: {
    search?: string;
    entity_type?: string;
    skip?: number;
    limit?: number;
}): Promise<{ total: number; entities: Entity[] }> {

    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.entity_type) query.set("entity_type", params.entity_type);
    if (params?.skip !== undefined) query.set("skip", String(params.skip));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));

    const res = await fetch(`${API_BASE}/entities?${query}`);
    if (!res.ok) throw new Error("Failed to fetch entities");
    return res.json();
}

export async function fetchEntity(id: string): Promise<Entity> {
    console.log("fetching entity at:", `${API_BASE}/entities/${id}`);
    const res = await fetch(`${API_BASE}/entities/${id}`);
    if (!res.ok) throw new Error("Failed to fetch entity");
    return res.json();
}

export async function fetchSources(): Promise<Source[]> {
    const res = await fetch(`${API_BASE}/sources`);
    if (!res.ok) throw new Error("Failed to fetch sources");
    return res.json();
}

export async function fetchJobs(): Promise<IngestionJob[]> {
    const res = await fetch(`${API_BASE}/jobs`);
    if (!res.ok) throw new Error("Failed to fetch jobs");
    return res.json();
}