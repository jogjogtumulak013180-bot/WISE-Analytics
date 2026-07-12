"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

interface Kpi { label: string; value: string; hint?: string }
interface Series { name: string; points: { x: string; y: number }[] }
interface Payload {
  kpis: Kpi[];
  chart?: { title: string; kind: "line" | "bar"; series: Series[] };
  table?: { title: string; columns: string[]; rows: (string | number)[][] };
  note?: string;
  error?: string;
}
interface ProjectOpt { id: string; name: string }

const PALETTE = ["#2dd4bf", "#38bdf8", "#f59e0b", "#a78bfa", "#f472b6", "#4ade80", "#fb7185", "#facc15"];

export default function AnalyticsPanel({
  pillar,
  group,
  item,
}: {
  pillar: string;
  group: string;
  item: string;
}) {
  const search = useSearchParams();
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [projectId, setProjectId] = useState(search.get("project") ?? "");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("wa_projects")
      .select("id, name")
      .eq("pillar", pillar)
      .eq("sub_pillar", group)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const opts = (data as ProjectOpt[]) ?? [];
        setProjects(opts);
        setProjectId((prev) => prev || opts[0]?.id || "");
      });
  }, [pillar, group]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(
      `/api/analytics?pillar=${pillar}&group=${group}&item=${item}&project=${projectId}`
    )
      .then((r) => r.json())
      .then((j) => setPayload(j as Payload))
      .catch((e) => setPayload({ kpis: [], error: String(e) }))
      .finally(() => setLoading(false));
  }, [pillar, group, item, projectId]);

  if (projects.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>No projects yet</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Create a project under this sub-pillar and import its data workbook —
          one import populates every dashboard here.
        </div>
        <Link href={`/projects/new?pillar=${pillar}`} style={styles.button}>
          + New Project
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.toolbar}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
          PROJECT{" "}
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={styles.select}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {projectId && (
          <Link href={`/projects/${projectId}/import`} style={styles.ghost}>
            Import / update data
          </Link>
        )}
      </div>

      {loading && <div style={styles.note}>Computing…</div>}

      {!loading && payload?.error && <div style={styles.note}>Error: {payload.error}</div>}
      {!loading && payload?.note && <div style={styles.note}>{payload.note}</div>}

      {!loading && payload && payload.kpis.length > 0 && (
        <div style={styles.kpiRow}>
          {payload.kpis.map((k, i) => (
            <div key={i} style={styles.kpi}>
              <div style={styles.kpiValue}>{k.value}</div>
              <div style={styles.kpiLabel}>{k.label}</div>
              {k.hint && <div style={styles.kpiHint}>{k.hint}</div>}
            </div>
          ))}
        </div>
      )}

      {!loading && payload?.chart && payload.chart.series.some((s) => s.points.length > 0) && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>{payload.chart.title}</div>
          <Chart kind={payload.chart.kind} series={payload.chart.series} />
          <div style={styles.legend}>
            {payload.chart.series.map((s, i) => (
              <span key={s.name} style={{ marginRight: 14 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: PALETTE[i % PALETTE.length],
                    marginRight: 5,
                  }}
                />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {!loading && payload?.table && payload.table.rows.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>{payload.table.title}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {payload.table.columns.map((c) => (
                    <th key={c} style={styles.th}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j} style={{ ...styles.td, textAlign: j === 0 ? "left" : "right" }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Chart({ kind, series }: { kind: "line" | "bar"; series: Series[] }) {
  const W = 760;
  const H = 260;
  const PAD = { l: 56, r: 12, t: 12, b: 28 };

  const { xs, maxY } = useMemo(() => {
    const xset: string[] = [];
    let my = 0;
    for (const s of series) {
      for (const p of s.points) {
        if (!xset.includes(p.x)) xset.push(p.x);
        if (p.y > my) my = p.y;
      }
    }
    return { xs: xset, maxY: my || 1 };
  }, [series]);

  const x = (i: number) =>
    PAD.l + (xs.length <= 1 ? 0 : (i * (W - PAD.l - PAD.r)) / (xs.length - 1));
  const xBand = (i: number) => PAD.l + ((i + 0.5) * (W - PAD.l - PAD.r)) / xs.length;
  const y = (v: number) => H - PAD.b - (v / maxY) * (H - PAD.t - PAD.b);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxY * f));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(148,163,184,.15)" />
          <text x={PAD.l - 8} y={y(t) + 4} fontSize={10} fill="#94a3b8" textAnchor="end">
            {t.toLocaleString()}
          </text>
        </g>
      ))}
      {xs.map((lbl, i) => (
        <text
          key={lbl + i}
          x={kind === "bar" ? xBand(i) : x(i)}
          y={H - 8}
          fontSize={10}
          fill="#94a3b8"
          textAnchor="middle"
        >
          {lbl}
        </text>
      ))}
      {kind === "bar"
        ? series.map((s, si) => {
            const bw = ((W - PAD.l - PAD.r) / xs.length) * (0.7 / series.length);
            return s.points.map((p) => {
              const xi = xs.indexOf(p.x);
              return (
                <rect
                  key={s.name + p.x}
                  x={xBand(xi) - (bw * series.length) / 2 + si * bw}
                  y={y(p.y)}
                  width={bw}
                  height={H - PAD.b - y(p.y)}
                  fill={PALETTE[si % PALETTE.length]}
                  rx={2}
                />
              );
            });
          })
        : series.map((s, si) => {
            const pts = s.points
              .map((p) => `${x(xs.indexOf(p.x))},${y(p.y)}`)
              .join(" ");
            return (
              <g key={s.name}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={PALETTE[si % PALETTE.length]}
                  strokeWidth={2}
                />
                {s.points.map((p) => (
                  <circle
                    key={p.x}
                    cx={x(xs.indexOf(p.x))}
                    cy={y(p.y)}
                    r={2.6}
                    fill={PALETTE[si % PALETTE.length]}
                  />
                ))}
              </g>
            );
          })}
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12 },
  select: {
    background: "var(--navy-900)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    marginLeft: 8,
  },
  ghost: {
    color: "var(--teal-400)",
    border: "1px solid var(--teal-500)",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 12,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  button: {
    display: "inline-block",
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    background: "var(--navy-900)",
    border: "1px dashed var(--border)",
    borderRadius: 12,
  },
  note: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "14px 16px",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 16,
  },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 },
  kpi: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "16px 18px",
  },
  kpiValue: { fontSize: 22, fontWeight: 800, letterSpacing: -0.3 },
  kpiLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase" },
  kpiHint: { fontSize: 11, color: "var(--text-secondary)", marginTop: 4 },
  card: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "18px 20px",
    marginBottom: 18,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, marginBottom: 12 },
  legend: { fontSize: 12, color: "var(--text-secondary)", marginTop: 8 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid var(--border)",
    color: "var(--text-muted)",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  td: { padding: "7px 10px", borderBottom: "1px solid rgba(148,163,184,.08)" },
};
