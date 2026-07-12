"use client";

import { useEffect, useMemo, useState } from "react";
import {
  supabase,
  CATEGORIES,
  STATUSES,
  type WaProject,
  type ProjectCategory,
  type ProjectStatus,
} from "./lib/supabase";
import Sidebar from "./components/Sidebar";

const CATEGORY_META: Record<
  ProjectCategory,
  { short: string; icon: string; accent: string }
> = {
  "Construction Management": { short: "Construction", icon: "\u{1F3D7}️", accent: "#f59e0b" },
  "Local Development Planning": { short: "Dev Planning", icon: "\u{1F5FA}️", accent: "#34d399" },
  "Municipal Intelligence": { short: "Municipal Intel", icon: "\u{1F3DB}️", accent: "#a78bfa" },
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  Planning: "#9fb0c9",
  Ongoing: "#22d3ee",
  "On Hold": "#a78bfa",
  Completed: "#34d399",
};

const emptyForm = {
  name: "",
  category: CATEGORIES[0] as ProjectCategory,
  client: "",
  location: "",
  status: "Planning" as ProjectStatus,
  progress: 0,
  start_date: "",
  target_end_date: "",
  description: "",
  notes: "",
};

export default function Home() {
  const [projects, setProjects] = useState<WaProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from("wa_projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setProjects((data as WaProject[]) ?? []);
    }
    setLoading(false);
  }

  function openNewForm(category?: ProjectCategory) {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category: category ?? (CATEGORIES[0] as ProjectCategory),
    });
    setShowForm(true);
  }

  function openEditForm(p: WaProject) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      client: p.client ?? "",
      location: p.location ?? "",
      status: p.status,
      progress: p.progress,
      start_date: p.start_date ?? "",
      target_end_date: p.target_end_date ?? "",
      description: p.description ?? "",
      notes: p.notes ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      name: form.name.trim(),
      category: form.category,
      client: form.client.trim() || null,
      location: form.location.trim() || null,
      status: form.status,
      progress: Number(form.progress),
      start_date: form.start_date || null,
      target_end_date: form.target_end_date || null,
      description: form.description.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (!payload.name) {
      setErrorMsg("Project name is required.");
      setSaving(false);
      return;
    }

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("wa_projects")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("wa_projects").insert(payload));
    }

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    await fetchProjects();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const { error } = await supabase.from("wa_projects").delete().eq("id", id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await fetchProjects();
  }

  const overallStats = useMemo(() => {
    const total = projects.length;
    const ongoing = projects.filter((p) => p.status === "Ongoing").length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    const onHold = projects.filter((p) => p.status === "On Hold").length;
    const avgProgress =
      total === 0
        ? 0
        : Math.round(projects.reduce((s, p) => s + p.progress, 0) / total);
    return { total, ongoing, completed, onHold, avgProgress };
  }, [projects]);

  return (
    <div style={styles.shell}>
      <Sidebar variant="root" activeView="Overview" overviewCount={overallStats.total} />

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>ALL PROJECTS · CROSS SERVICE LINE</div>
            <h1 style={styles.h1}>All Projects</h1>
            <div style={styles.headerSub}>
              Everything you&rsquo;re working on, across every service line.
            </div>
          </div>
          <button style={styles.primaryBtn} onClick={() => openNewForm()}>
            + New Project
          </button>
        </header>

        {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

        <section style={styles.statsRow}>
          <StatCard label="Total Projects" value={overallStats.total} />
          <StatCard label="Ongoing" value={overallStats.ongoing} color={STATUS_COLOR.Ongoing} />
          <StatCard label="Completed" value={overallStats.completed} color={STATUS_COLOR.Completed} />
          <StatCard label="On Hold" value={overallStats.onHold} color={STATUS_COLOR["On Hold"]} />
          <StatCard label="Avg. Progress" value={`${overallStats.avgProgress}%`} />
        </section>

        {loading ? (
          <div style={styles.emptyState}>Loading projects&hellip;</div>
        ) : projects.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{"\u{1F4CB}"}</div>
            No projects yet. Click &ldquo;+ New Project&rdquo; to add one.
          </div>
        ) : (
          <section style={styles.grid}>
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={() => openEditForm(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </section>
        )}
      </main>

      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.h2}>
              {editingId ? "Edit Project" : "New Project"}
            </h2>
            <form onSubmit={handleSubmit}>
              <FormRow label="Project Name *">
                <input
                  style={styles.input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Barangay San Isidro Road Widening"
                  required
                />
              </FormRow>

              <div style={styles.formGrid2}>
                <FormRow label="Category">
                  <select
                    style={styles.input}
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as ProjectCategory })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Status">
                  <select
                    style={styles.input}
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as ProjectStatus })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </FormRow>
              </div>

              <div style={styles.formGrid2}>
                <FormRow label="Client">
                  <input
                    style={styles.input}
                    value={form.client}
                    onChange={(e) => setForm({ ...form, client: e.target.value })}
                    placeholder="e.g. LGU Municipality of..."
                  />
                </FormRow>
                <FormRow label="Location">
                  <input
                    style={styles.input}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Bulacan, Philippines"
                  />
                </FormRow>
              </div>

              <div style={styles.formGrid2}>
                <FormRow label="Start Date">
                  <input
                    type="date"
                    style={styles.input}
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </FormRow>
                <FormRow label="Target End Date">
                  <input
                    type="date"
                    style={styles.input}
                    value={form.target_end_date}
                    onChange={(e) => setForm({ ...form, target_end_date: e.target.value })}
                  />
                </FormRow>
              </div>

              <FormRow label={`Progress: ${form.progress}%`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
              </FormRow>

              <FormRow label="Description">
                <textarea
                  style={{ ...styles.input, minHeight: 60 }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormRow>

              <FormRow label="Notes">
                <textarea
                  style={{ ...styles.input, minHeight: 60 }}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </FormRow>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color ?? "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: WaProject;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = CATEGORY_META[project.category];
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: meta.accent, fontWeight: 600, marginBottom: 4 }}>
            {meta.icon} {project.category}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{project.name}</div>
        </div>
        <span
          style={{
            ...styles.badge,
            color: STATUS_COLOR[project.status],
            borderColor: STATUS_COLOR[project.status],
          }}
        >
          {project.status}
        </span>
      </div>

      {(project.client || project.location) && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
          {project.client}
          {project.client && project.location ? " — " : ""}
          {project.location}
        </div>
      )}

      {project.description && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
          {project.description}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${project.progress}%`,
              background: meta.accent,
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          {project.progress}% complete
          {project.target_end_date ? ` · due ${project.target_end_date}` : ""}
        </div>
      </div>

      <div style={styles.cardActions}>
        <button style={styles.linkBtn} onClick={onEdit}>
          Edit
        </button>
        <button style={{ ...styles.linkBtn, color: "var(--danger)" }} onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  main: { padding: "48px 40px 60px", maxWidth: 1200, width: "100%", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    gap: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    color: "var(--text-muted)",
    marginBottom: 12,
  },
  h1: { fontSize: 48, fontWeight: 800, margin: 0, letterSpacing: -1 },
  h2: { fontSize: 18, fontWeight: 700, margin: "0 0 16px" },
  headerSub: { fontSize: 14, color: "var(--text-secondary)", marginTop: 10 },
  primaryBtn: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  errorBanner: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid var(--danger)",
    color: "var(--danger)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "16px 18px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--text-muted)",
    background: "var(--navy-900)",
    border: "1px dashed var(--border)",
    borderRadius: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 14,
  },
  card: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 18,
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    border: "1px solid",
    borderRadius: 20,
    padding: "3px 10px",
    whiteSpace: "nowrap",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    background: "var(--navy-800)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  cardActions: {
    display: "flex",
    gap: 14,
    marginTop: 14,
    borderTop: "1px solid var(--border)",
    paddingTop: 10,
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "var(--teal-400)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5,10,20,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 50,
  },
  modal: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 24,
    width: "100%",
    maxWidth: 520,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  input: {
    width: "100%",
    background: "var(--navy-800)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "9px 12px",
    color: "var(--text-primary)",
    fontSize: 13,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
};
