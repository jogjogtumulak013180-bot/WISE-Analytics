"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import type { CapabilityGroup } from "../lib/waterSystems";
import { PILLARS } from "../lib/pillars";

interface CapabilityHubProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  groups: CapabilityGroup[];
  basePath: string;
}

export default function CapabilityHub({ eyebrow, title, subtitle, groups, basePath }: CapabilityHubProps) {
  const router = useRouter();

  function handleJump(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) return;
    router.push(`${basePath}/${value}`);
    e.target.value = "";
  }

  return (
    <div style={styles.shell}>
      <Sidebar variant="secondary" />

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>{eyebrow}</div>
            <h1 style={styles.h1}>{title}</h1>
            <div style={styles.headerSub}>{subtitle}</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <Link
              href={`/projects/new?pillar=${
                PILLARS.find((p) => p.basePath === basePath)?.slug ?? ""
              }`}
              style={styles.newButton}
            >
              + New Project
            </Link>
          <select
            defaultValue=""
            onChange={handleJump}
            style={styles.dropdown}
            aria-label="Open a capability dashboard"
          >
            <option value="" disabled>
              Open a dashboard…
            </option>
            {groups.map((group) => (
              <optgroup key={group.slug} label={group.title}>
                {group.items.map((item) => (
                  <option key={item.slug} value={`${group.slug}/${item.slug}`}>
                    {item.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          </div>
        </header>

        {groups.map((group) => (
          <section key={group.slug} style={{ marginBottom: 28 }}>
            <div style={styles.groupHeader}>
              <h2 style={styles.groupTitle}>{group.title}</h2>
              <Link
                href={`/import/${
                  PILLARS.find((p) => p.basePath === basePath)?.slug ?? ""
                }/${group.slug}`}
                style={styles.importButton}
              >
                ⬆ Import Data
              </Link>
            </div>
            <div style={styles.grid}>
              {group.items.map((item) => (
                <a key={item.slug} href={`${basePath}/${group.slug}/${item.slug}`} style={styles.card}>
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
  shell: { display: "flex", flexDirection: "column", minHeight: "100vh" },
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
  headerSub: { fontSize: 14, color: "var(--text-secondary)", marginTop: 10, maxWidth: 560 },
  newButton: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  dropdown: {
    background: "var(--navy-900)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
    maxWidth: 240,
  },
  groupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid var(--border)",
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
  },
  importButton: {
    color: "var(--teal-400)",
    border: "1px solid var(--teal-500)",
    borderRadius: 7,
    padding: "5px 12px",
    fontWeight: 700,
    fontSize: 12,
    textDecoration: "none",
    whiteSpace: "nowrap",
    flexShrink: 0,
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
