"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { WATER_SYSTEM_GROUPS, TOTAL_CAPABILITY_COUNT } from "../lib/waterSystems";

export default function WaterSystemsHub() {
  const router = useRouter();

  function handleJump(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) return;
    router.push(`/water-systems/${value}`);
    e.target.value = "";
  }

  return (
    <div style={styles.shell}>
      <Sidebar variant="water-systems" />

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Municipal Water Systems</h1>
            <div style={styles.headerSub}>
              {TOTAL_CAPABILITY_COUNT} capability areas across the full water utility
              lifecycle — planning, engineering, construction, operations, finance,
              assets, customers, executive intelligence, and compliance.
            </div>
          </div>

          <select
            defaultValue=""
            onChange={handleJump}
            style={styles.dropdown}
            aria-label="Open a capability dashboard"
          >
            <option value="" disabled>
              + New Project (open a dashboard)
            </option>
            {WATER_SYSTEM_GROUPS.map((group) => (
              <optgroup key={group.slug} label={group.title}>
                {group.items.map((item) => (
                  <option key={item.slug} value={`${group.slug}/${item.slug}`}>
                    {item.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </header>

        {WATER_SYSTEM_GROUPS.map((group) => (
          <section key={group.slug} style={{ marginBottom: 28 }}>
            <h2 style={styles.groupTitle}>{group.title}</h2>
            <div style={styles.grid}>
              {group.items.map((item) => (
                <a
                  key={item.slug}
                  href={`/water-systems/${group.slug}/${item.slug}`}
                  style={styles.card}
                >
                  {item.title}
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh" },
  main: { flex: 1, padding: "28px 36px", maxWidth: 1200 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 20,
  },
  h1: { fontSize: 24, fontWeight: 700, margin: 0 },
  headerSub: { fontSize: 13, color: "var(--text-secondary)", marginTop: 6, maxWidth: 560 },
  dropdown: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
    maxWidth: 260,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid var(--border)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 10,
  },
  card: {
    display: "block",
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "12px 14px",
    color: "var(--text-primary)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
  },
};
