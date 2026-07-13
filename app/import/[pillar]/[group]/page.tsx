"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import RequirementsTable from "../../../components/RequirementsTable";
import { findPillar } from "../../../lib/pillars";
import { templateForSubPillar } from "../../../lib/templates";
import { supabase } from "../../../lib/supabase";

interface ProjectOpt {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
}

export default function ImportHubPage({
  params,
}: {
  params: { pillar: string; group: string };
}) {
  const router = useRouter();
  const pillar = findPillar(params.pillar);
  const group = pillar?.groups.find((g) => g.slug === params.group) ?? null;
  const template = useMemo(
    () => templateForSubPillar(params.pillar, params.group),
    [params.pillar, params.group]
  );

  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("wa_projects")
      .select("id, name, location, created_at")
      .eq("pillar", params.pillar)
      .eq("sub_pillar", params.group)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const opts = (data as ProjectOpt[]) ?? [];
        setProjects(opts);
        setSelected(opts[0]?.id ?? "");
        setLoaded(true);
      });
  }, [params.pillar, params.group]);

  if (!pillar || !group) return notFound();

  return (
    <div style={styles.shell}>
      <Sidebar variant="secondary" />
      <main style={styles.main}>
        <div style={styles.eyebrow}>
          <Link href={pillar.basePath} style={styles.crumbLink}>
            {pillar.title}
          </Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <span>{group.title}</span>
        </div>
        <h1 style={styles.h1}>Import Data</h1>

        {!template ? (
          <section style={styles.card}>
            {params.pillar === "water-systems" && params.group === "operations-report" ? (
              <>
                The Water Operations Report is a <strong>generated output</strong> —
                it is compiled automatically from the Operations Monitoring and
                Utility Financial Operations datasets. Import those two workbooks
                and this report fills itself; there is nothing to upload here.
              </>
            ) : (
              <>No data template is defined for this sub-pillar yet.</>
            )}
          </section>
        ) : (
          <>
            <section style={styles.card}>
              <div style={styles.step}>1 — Choose the project to import into</div>
              {!loaded ? (
                <div style={styles.muted}>Loading projects…</div>
              ) : projects.length === 0 ? (
                <div style={styles.muted}>
                  No {group.title} projects yet — create one first; its general info
                  sheet declares the canonical names your data is validated against.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    style={styles.select}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.location ? ` — ${p.location}` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => selected && router.push(`/projects/${selected}/import`)}
                    style={styles.button}
                    disabled={!selected}
                  >
                    Import into this project →
                  </button>
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <Link
                  href={`/projects/new?pillar=${pillar.slug}&group=${group.slug}`}
                  style={styles.ghost}
                >
                  + New {group.title} Project
                </Link>
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.step}>2 — Data requirements ({template.title})</div>
              <p style={styles.p}>
                One workbook populates every dashboard under {group.title}. Download
                the template from the project&rsquo;s import page — it includes a
                Requirements sheet with the same contract below.
              </p>
              <RequirementsTable template={template} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: "flex", flexDirection: "column", minHeight: "100vh" },
  main: { padding: "48px 40px 60px", maxWidth: 1100, width: "100%", margin: "0 auto" },
  eyebrow: { fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "var(--text-muted)", marginBottom: 12 },
  crumbLink: { color: "var(--teal-400)", textDecoration: "none" },
  h1: { fontSize: 38, fontWeight: 800, margin: "0 0 24px", letterSpacing: -0.5 },
  card: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "20px 22px",
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 1.55,
  },
  step: { fontSize: 13, fontWeight: 800, letterSpacing: 0.5, marginBottom: 10 },
  p: { fontSize: 13, color: "var(--text-secondary)", margin: "0 0 14px" },
  muted: { fontSize: 13, color: "var(--text-muted)" },
  select: {
    background: "var(--navy-950)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    minWidth: 280,
  },
  button: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  ghost: {
    display: "inline-block",
    color: "var(--teal-400)",
    border: "1px solid var(--teal-500)",
    borderRadius: 8,
    padding: "9px 16px",
    fontWeight: 700,
    fontSize: 12,
    textDecoration: "none",
  },
};
