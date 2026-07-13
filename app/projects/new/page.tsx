"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { PILLARS, findPillar } from "../../lib/pillars";
import { templateForSubPillar } from "../../lib/templates";
import { supabase } from "../../lib/supabase";

function NewProjectForm() {
  const router = useRouter();
  const search = useSearchParams();

  const [pillarSlug, setPillarSlug] = useState(search.get("pillar") ?? "");
  const [subPillar, setSubPillar] = useState(search.get("group") ?? "");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pillar = useMemo(() => findPillar(pillarSlug), [pillarSlug]);
  const template = useMemo(
    () => (pillarSlug && subPillar ? templateForSubPillar(pillarSlug, subPillar) : null),
    [pillarSlug, subPillar]
  );

  async function handleCreate() {
    if (!pillar || !subPillar || !name.trim()) {
      setError("Pillar, sub-pillar, and project name are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const generalInfo: Record<string, unknown> = {};
    if (template) {
      for (const f of template.projectFields) {
        const v = extra[f.key] ?? "";
        if (f.kind === "list") {
          generalInfo[f.key] = v
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (f.kind === "number") {
          generalInfo[f.key] = v ? Number(v) : null;
        } else {
          generalInfo[f.key] = v || null;
        }
      }
    }

    const { data, error: err } = await supabase
      .from("wa_projects")
      .insert({
        name: name.trim(),
        category: pillar.title,
        pillar: pillar.slug,
        sub_pillar: subPillar,
        location: location.trim() || null,
        client: client.trim() || null,
        description: description.trim() || null,
        general_info: generalInfo,
      })
      .select("id")
      .single();

    setSaving(false);
    if (err || !data) {
      setError(err?.message ?? "Failed to create project.");
      return;
    }
    router.push(`/projects/${data.id}/import`);
  }

  return (
    <main style={styles.main}>
      <div style={styles.eyebrow}>NEW PROJECT</div>
      <h1 style={styles.h1}>Create a Project</h1>

      <section style={styles.card}>
        <div style={styles.sectionTitle}>1. Where does this project belong?</div>
        <div style={styles.row2}>
          <label style={styles.label}>
            Pillar
            <select
              value={pillarSlug}
              onChange={(e) => {
                setPillarSlug(e.target.value);
                setSubPillar("");
              }}
              style={styles.input}
            >
              <option value="">Select a pillar…</option>
              {PILLARS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.label}>
            Sub-pillar
            <select
              value={subPillar}
              onChange={(e) => setSubPillar(e.target.value)}
              style={styles.input}
              disabled={!pillar}
            >
              <option value="">Select a sub-pillar…</option>
              {pillar?.groups.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {pillarSlug && subPillar && (
          <div style={styles.hint}>
            {template
              ? `Data template available: ${template.title}. All ${
                  pillar?.groups.find((g) => g.slug === subPillar)?.items.length ?? 0
                } dashboards under this sub-pillar will be populated from one import.`
              : "No data template for this sub-pillar yet — the project will be created, and its import pipeline is coming in a later phase."}
          </div>
        )}
      </section>

      <section style={styles.card}>
        <div style={styles.sectionTitle}>2. General information</div>
        <div style={styles.row2}>
          <label style={styles.label}>
            Project name *
            <input value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
          </label>
          <label style={styles.label}>
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={styles.input}
              placeholder="e.g., Sogod, Cebu"
            />
          </label>
        </div>
        <div style={styles.row2}>
          <label style={styles.label}>
            Client / LGU
            <input value={client} onChange={(e) => setClient(e.target.value)} style={styles.input} />
          </label>
          <label style={styles.label}>
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        {template && template.projectFields.length > 0 && (
          <>
            <div style={{ ...styles.sectionTitle, marginTop: 18 }}>
              3. {template.title} — project details
            </div>
            <div style={styles.row2}>
              {template.projectFields.map((f) => (
                <label key={f.key} style={styles.label}>
                  {f.label}
                  {f.kind === "list" ? (
                    <textarea
                      value={extra[f.key] ?? ""}
                      onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
                      style={{ ...styles.input, minHeight: 96, fontFamily: "inherit" }}
                    />
                  ) : (
                    <input
                      type={f.kind === "number" ? "number" : "text"}
                      value={extra[f.key] ?? ""}
                      onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
                      style={styles.input}
                    />
                  )}
                </label>
              ))}
            </div>
            <div style={styles.hint}>
              These lists become the canonical names your uploaded data is validated
              against (case-insensitive — &ldquo;bagakay &rdquo; will be normalized to
              &ldquo;Bagakay&rdquo;).
            </div>
          </>
        )}
      </section>

      {error && <div style={styles.error}>{error}</div>}

      <button onClick={handleCreate} disabled={saving} style={styles.button}>
        {saving ? "Creating…" : "Create Project →"}
      </button>
    </main>
  );
}

export default function NewProjectPage() {
  return (
    <div style={styles.shell}>
      <Sidebar variant="secondary" />
      <Suspense>
        <NewProjectForm />
      </Suspense>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: "flex", flexDirection: "column", minHeight: "100vh" },
  main: { padding: "48px 40px 60px", maxWidth: 860, width: "100%", margin: "0 auto" },
  eyebrow: { fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--text-muted)", marginBottom: 12 },
  h1: { fontSize: 40, fontWeight: 800, margin: "0 0 24px", letterSpacing: -1 },
  card: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "20px 22px",
    marginBottom: 18,
  },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 14 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" },
  input: {
    background: "var(--navy-950)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 12px",
    color: "var(--text-primary)",
    fontSize: 13,
  },
  hint: { fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 },
  error: {
    background: "rgba(220,60,60,.12)",
    border: "1px solid rgba(220,60,60,.4)",
    color: "#f28b8b",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 14,
  },
  button: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "12px 22px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
};
