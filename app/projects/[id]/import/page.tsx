"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import RequirementsTable from "../../../components/RequirementsTable";
import { supabase } from "../../../lib/supabase";
import { findPillar } from "../../../lib/pillars";
import { templateForSubPillar } from "../../../lib/templates";

interface ProjectRow {
  id: string;
  name: string;
  pillar: string | null;
  sub_pillar: string | null;
  location: string | null;
}

interface UploadOutcome {
  datasetId: string;
  status: string;
  summary?: {
    totalRows: number;
    validRows: number;
    repairedRows: number;
    quarantinedRows: number;
    repairs: number;
  };
  structuralErrors?: { sheet: string; message: string }[];
  quarantined?: { sheet: string; rowNum: number; errors: { col: string; rule: string; message: string }[] }[];
  repairsAudit?: { sheet: string; rowNum: number; repairs: { col: string; rule: string; old: string; new: string }[] }[];
  error?: string;
}

export default function ImportPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<UploadOutcome | null>(null);

  useEffect(() => {
    supabase
      .from("wa_projects")
      .select("id, name, pillar, sub_pillar, location")
      .eq("id", params.id)
      .single()
      .then(({ data }) => setProject((data as ProjectRow) ?? null));
  }, [params.id]);

  const pillar = useMemo(
    () => (project?.pillar ? findPillar(project.pillar) : null),
    [project]
  );
  const template = useMemo(
    () =>
      project?.pillar && project.sub_pillar
        ? templateForSubPillar(project.pillar, project.sub_pillar)
        : null,
    [project]
  );
  const group = pillar?.groups.find((g) => g.slug === project?.sub_pillar) ?? null;

  async function handleUpload() {
    if (!file || !project) return;
    setBusy(true);
    setOutcome(null);
    const fd = new FormData();
    fd.append("projectId", project.id);
    fd.append("file", file);
    try {
      const res = await fetch("/api/datasets", { method: "POST", body: fd });
      const json = (await res.json()) as UploadOutcome;
      setOutcome(json);
    } catch (e) {
      setOutcome({ datasetId: "", status: "error", error: String(e) });
    }
    setBusy(false);
  }

  if (!project) {
    return (
      <div style={styles.shell}>
        <Sidebar variant="secondary" />
        <main style={styles.main}>Loading…</main>
      </div>
    );
  }

  const ok = outcome?.status === "promoted";
  const warn = outcome?.status === "promoted_with_warnings";
  const rejected = outcome?.status === "rejected";

  return (
    <div style={styles.shell}>
      <Sidebar variant="secondary" />
      <main style={styles.main}>
        <div style={styles.eyebrow}>
          {pillar?.title ?? project.pillar} / {group?.title ?? project.sub_pillar}
        </div>
        <h1 style={styles.h1}>{project.name}</h1>
        <div style={styles.sub}>{project.location}</div>

        {!template ? (
          <section style={styles.card}>
            No data template is available for this sub-pillar yet. The project has
            been created; its import pipeline arrives in a later phase.
          </section>
        ) : (
          <>
            <section style={styles.card}>
              <div style={styles.step}>STEP 1 — Download the data template</div>
              <p style={styles.p}>
                One workbook populates every dashboard under {group?.title}. Fill it
                in without renaming sheets or headers, then upload it below.
              </p>
              <a href={`/api/templates/${template.code}`} style={styles.buttonGhost}>
                ⬇ Download {template.fileName}
              </a>
              <details style={styles.details}>
                <summary style={styles.summary}>
                  View column &amp; data type requirements
                </summary>
                <div style={{ marginTop: 12 }}>
                  <RequirementsTable template={template} />
                </div>
              </details>
            </section>

            <section style={styles.card}>
              <div style={styles.step}>STEP 2 — Upload the filled-in workbook</div>
              <p style={styles.p}>
                Validation, cleaning, and promotion run automatically: minor issues
                (formats, capitalization, N/A) are fixed and logged; rows that cannot
                be cleaned are quarantined for your review while the rest import.
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={{ fontSize: 13 }}
                />
                <button
                  onClick={handleUpload}
                  disabled={!file || busy}
                  style={{ ...styles.button, opacity: !file || busy ? 0.6 : 1 }}
                >
                  {busy ? "Processing…" : "Upload & Import"}
                </button>
              </div>
            </section>

            {outcome && (
              <section
                style={{
                  ...styles.card,
                  borderColor: ok
                    ? "rgba(60,200,140,.5)"
                    : warn
                    ? "rgba(230,180,60,.5)"
                    : "rgba(220,60,60,.5)",
                }}
              >
                <div style={styles.step}>
                  {ok && "✅ IMPORTED — all rows promoted to core"}
                  {warn && "⚠️ IMPORTED WITH WARNINGS — some rows need your review"}
                  {rejected && "❌ REJECTED — the workbook structure doesn't match the template"}
                  {outcome.status === "error" && `❌ ERROR — ${outcome.error}`}
                </div>

                {outcome.summary && (
                  <div style={styles.kpiRow}>
                    <Kpi label="Rows read" value={outcome.summary.totalRows} />
                    <Kpi label="Promoted" value={outcome.summary.validRows} />
                    <Kpi label="Auto-repaired" value={outcome.summary.repairedRows} />
                    <Kpi label="Quarantined" value={outcome.summary.quarantinedRows} />
                  </div>
                )}

                {rejected && outcome.structuralErrors && (
                  <ul style={styles.list}>
                    {outcome.structuralErrors.map((e, i) => (
                      <li key={i}>
                        <strong>{e.sheet}:</strong> {e.message}
                      </li>
                    ))}
                  </ul>
                )}

                {warn && outcome.quarantined && outcome.quarantined.length > 0 && (
                  <>
                    <div style={styles.subhead}>
                      Needs your review (kept in staging, not deleted):
                    </div>
                    <ul style={styles.list}>
                      {outcome.quarantined.slice(0, 25).map((q, i) => (
                        <li key={i}>
                          <strong>
                            {q.sheet} row {q.rowNum}:
                          </strong>{" "}
                          {q.errors.map((e) => `${e.col} — ${e.message}`).join("; ")}
                        </li>
                      ))}
                      {outcome.quarantined.length > 25 && (
                        <li>…and {outcome.quarantined.length - 25} more.</li>
                      )}
                    </ul>
                  </>
                )}

                {(ok || warn) &&
                  outcome.repairsAudit &&
                  outcome.repairsAudit.length > 0 && (
                    <>
                      <div style={styles.subhead}>Auto-repairs (audit trail):</div>
                      <ul style={styles.list}>
                        {outcome.repairsAudit.slice(0, 25).map((r, i) => (
                          <li key={i}>
                            <strong>
                              {r.sheet} row {r.rowNum}:
                            </strong>{" "}
                            {r.repairs
                              .map((x) => `${x.col}: "${x.old}" → "${x.new}" (${x.rule})`)
                              .join("; ")}
                          </li>
                        ))}
                        {outcome.repairsAudit.length > 25 && (
                          <li>…and {outcome.repairsAudit.length - 25} more.</li>
                        )}
                      </ul>
                    </>
                  )}

                {(ok || warn) && pillar && group && (
                  <div style={{ marginTop: 16 }}>
                    <Link
                      href={`${pillar.basePath}/${group.slug}/${group.items[0]?.slug ?? ""}?project=${project.id}`}
                      style={styles.button}
                    >
                      Open the dashboards →
                    </Link>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.kpi}>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: "flex", flexDirection: "column", minHeight: "100vh" },
  main: { padding: "48px 40px 60px", maxWidth: 860, width: "100%", margin: "0 auto" },
  eyebrow: { fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "var(--text-muted)", marginBottom: 10 },
  h1: { fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: "var(--text-secondary)", margin: "6px 0 26px" },
  card: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "20px 22px",
    marginBottom: 18,
    fontSize: 13,
  },
  step: { fontSize: 13, fontWeight: 800, letterSpacing: 0.5, marginBottom: 8 },
  p: { fontSize: 13, color: "var(--text-secondary)", margin: "0 0 14px", lineHeight: 1.55 },
  button: {
    display: "inline-block",
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "none",
  },
  buttonGhost: {
    display: "inline-block",
    background: "transparent",
    color: "var(--teal-400)",
    border: "1px solid var(--teal-500)",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "none",
  },
  kpiRow: { display: "flex", gap: 22, margin: "14px 0" },
  kpi: { minWidth: 90 },
  subhead: { fontSize: 12, fontWeight: 800, letterSpacing: 0.5, margin: "12px 0 6px" },
  list: { margin: "4px 0", paddingLeft: 18, fontSize: 12.5, lineHeight: 1.7, color: "var(--text-secondary)" },
  details: { marginTop: 14 },
  summary: {
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 700,
    color: "var(--teal-400)",
  },
};
