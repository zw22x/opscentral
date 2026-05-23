"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Shield,
  Plane,
  Ship,
  User,
  Building2,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  ChevronRight,
  X,
} from "lucide-react";

import {
  fetchEntities,
  fetchSources,
  fetchJobs,
  fetchEntity,
  Entity,
  Source,
  IngestionJob,
} from "@/lib/api";

const ENTITY_TYPES = ["company", "person", "vessel", "ip_address", "aircraft"];

const SEVERITY_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

function EntityIcon({ type }: { type: string }) {
  const props = { size: 14, strokeWidth: 1.5 };
  switch (type) {
    case "company": return <Building2 {...props} />;
    case "person": return <User {...props} />;
    case "vessel": return <Ship {...props} />;
    case "aircraft": return <Plane {...props} />;
    case "ip_address": return <Network {...props} />;
    default: return <Database {...props} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "#10b981",
    running: "#3b82f6",
    failed: "#ef4444",
    pending: "#f59e0b",
  };
  return (
    <span style={{
      color: colors[status] ?? "#8892a4",
      background: '${colors[status] ?? "#8892a4"}18',
      border: '1px solid ${colors[status] ?? "#8892a4"}40',
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 500,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  return (
    <span style = {{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: SEVERITY_COLORS[severity] ?? "#8892a4",
      marginRight: 6,
    }} />
  );
}

export default function Home() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState<Source[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [activeTab, setActiveTab] = useState<"entities" | "sources" | "jobs">("entities");

  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEntities({
        search: search || undefined,
        entity_type: entityType || undefined,
        limit: 50,
      });
      setEntities(data.entities);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    }, [search, entityType]);

    useEffect(() => {
      loadEntities();
    }, [loadEntities]);

    useEffect(() => {
      fetchSources().then(setSources).catch(console.error);
      fetchJobs().then(setJobs).catch(console.error);
    }, []);

    const handleEntityClick = async (entity: Entity) => {
      try {
        const full = await fetchEntity(entity.id);
        setSelectedEntity(full);
      } catch (e) {
        console.error(e);
      }
    };

    const completedJobs = jobs.filter((j) => j.status === "completed").length;
    const failedJobs = jobs.filter((j) => j.status === "failed").length;
    const totalRecords = jobs.filter((j) => j.status === "completed").reduce((sum, j) => sum + parseInt(j.records_ingested ?? "0"), 0);

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Top bar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 52,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={18} color="#3b82f6" />
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "0.02em" }}>OpsCentral</span>
          <span style={{
            fontSize: 10,
            color: "#3b82f6",
            background: "#1e3a5f",
            padding: "2px 6px",
            borderRadius: 3,
            fontWeight: 500,
          }}>BETA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {total} entities · {sources.length} sources
          </span>
          <button
            onClick={loadEntities}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              padding: "4px 10px",
              borderRadius: 5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <aside style={{
          width: 200,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "16px 0",
          flexShrink: 0,
        }}>
          <div style={{ padding: "0 12px 8px", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>
            VIEWS
          </div>
          {[
            { key: "entities", label: "Entities", icon: <Database size={14} /> },
            { key: "sources", label: "Sources", icon: <Network size={14} /> },
            { key: "jobs", label: "Ingest Jobs", icon: <Clock size={14} /> },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as typeof activeTab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: activeTab === item.key ? "var(--accent-dim)" : "none",
                border: "none",
                borderLeft: activeTab === item.key ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === item.key ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                width: "100%",
                textAlign: "left",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <div style={{ padding: "20px 12px 8px", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>
            STATS
          </div>
          <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Total Entities", value: total, color: "var(--text-primary)" },
              { label: "Sources", value: sources.length, color: "var(--accent)" },
              { label: "Jobs Run", value: jobs.length, color: "var(--text-secondary)" },
              { label: "Records In", value: totalRecords, color: "#10b981" },
              { label: "Failed Jobs", value: failedJobs, color: failedJobs > 0 ? "#ef4444" : "var(--text-muted)" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{stat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Toolbar */}
          {activeTab === "entities" && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
              flexShrink: 0,
            }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search entities..."
                  style={{
                    width: "100%",
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "6px 10px 6px 30px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  color: entityType ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">All types</option>
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {(search || entityType) && (
                <button
                  onClick={() => { setSearch(""); setEntityType(""); }}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          )}

          {/* Content area */}
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>

            {/* Entities table */}
            {activeTab === "entities" && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Entity", "Type", "Description", "Meta", "Created", ""].map((h) => (
                        <th key={h} style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          letterSpacing: "0.06em",
                          background: "var(--surface-2)",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</td></tr>
                    ) : entities.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No entities found</td></tr>
                    ) : entities.map((entity, i) => (
                      <tr
                        key={entity.id}
                        onClick={() => handleEntityClick(entity)}
                        style={{
                          borderBottom: i < entities.length - 1 ? "1px solid var(--border)" : "none",
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "var(--accent)" }}><EntityIcon type={entity.entity_type} /></span>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{entity.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            padding: "2px 7px",
                            borderRadius: 4,
                          }}>{entity.entity_type}</span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-secondary)", fontSize: 12, maxWidth: 200 }}>
                          {entity.description || "—"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 11, fontFamily: "monospace" }}>
                          {Object.keys(entity.meta ?? {}).length > 0
                            ? Object.entries(entity.meta).map(([k, v]) => `${k}: ${v}`).join(" · ")
                            : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 11, whiteSpace: "nowrap" }}>
                          {new Date(entity.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sources table */}
            {activeTab === "sources" && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Source", "Type", "Last Ingested"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", background: "var(--surface-2)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: i < sources.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 11, color: "var(--text-secondary)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "2px 7px", borderRadius: 4 }}>
                            {s.source_type}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12 }}>
                          {s.last_ingested_at ? new Date(s.last_ingested_at).toLocaleString() : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Jobs table */}
            {activeTab === "jobs" && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Job ID", "Status", "Records", "Started", "Duration"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", background: "var(--surface-2)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((j, i) => {
                      const duration = j.finished_at
                        ? ((new Date(j.finished_at).getTime() - new Date(j.started_at).getTime()) / 1000).toFixed(2) + "s"
                        : "—";
                      return (
                        <tr key={j.id} style={{ borderBottom: i < jobs.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>
                            {j.id.slice(0, 8)}...
                          </td>
                          <td style={{ padding: "10px 14px" }}><StatusBadge status={j.status} /></td>
                          <td style={{ padding: "10px 14px", color: "var(--text-primary)", fontWeight: 500 }}>{j.records_ingested}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12 }}>
                            {new Date(j.started_at).toLocaleString()}
                          </td>
                          <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12 }}>{duration}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Entity detail panel */}
        {selectedEntity && (
          <aside style={{
            width: 320,
            background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--accent)" }}><EntityIcon type={selectedEntity.entity_type} /></span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{selectedEntity.name}</span>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>

              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>DETAILS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: "Type", value: selectedEntity.entity_type },
                    { label: "ID", value: selectedEntity.id.slice(0, 16) + "..." },
                    { label: "Created", value: new Date(selectedEntity.created_at).toLocaleDateString() },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: row.label === "ID" ? "monospace" : "inherit" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEntity.description && (
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>DESCRIPTION</div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{selectedEntity.description}</p>
                </div>
              )}

              {Object.keys(selectedEntity.meta ?? {}).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>METADATA</div>
                  <div style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 6, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(selectedEntity.meta).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{k}</span>
                        <span style={{ fontSize: 11, color: "var(--text-primary)", fontFamily: "monospace" }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>
                  ALERTS {selectedEntity.alerts && selectedEntity.alerts.length > 0 && (
                    <span style={{ color: "#ef4444" }}>({selectedEntity.alerts.length})</span>
                  )}
                </div>
                {!selectedEntity.alerts || selectedEntity.alerts.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontSize: 12 }}>
                    <CheckCircle size={13} />
                    No active alerts
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedEntity.alerts.map((alert) => (
                      <div key={alert.id} style={{
                        background: "var(--background)",
                        border: `1px solid ${SEVERITY_COLORS[alert.severity] ?? "#8892a4"}40`,
                        borderRadius: 6,
                        padding: 10,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                          <SeverityDot severity={alert.severity} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{alert.title}</span>
                        </div>
                        {alert.description && (
                          <p style={{ fontSize: 11, color: "var(--text-muted)", paddingLeft: 14 }}>{alert.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function sync(): any {
  throw new Error("Function not implemented.");
}
    