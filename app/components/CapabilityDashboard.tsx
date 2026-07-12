import Link from "next/link";
import Sidebar from "./Sidebar";
import type { CapabilityGroup, CapabilityItem } from "../lib/waterSystems";

interface CapabilityDashboardProps {
  hubTitle: string;
  hubHref: string;
  group: CapabilityGroup;
  item: CapabilityItem;
  children?: React.ReactNode;
}

export default function CapabilityDashboard({
  hubTitle,
  hubHref,
  group,
  item,
  children,
}: CapabilityDashboardProps) {
  return (
    <div style={styles.shell}>
      <Sidebar variant="secondary" />

      <main style={styles.main}>
        <div style={styles.breadcrumb}>
          <Link href={hubHref} style={styles.crumbLink}>
            {hubTitle}
          </Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <span>{group.title}</span>
        </div>

        <h1 style={styles.h1}>{item.title}</h1>

        {children ?? (
          <div style={styles.placeholder}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{"\u{1F6A7}"}</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Coming soon</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 480 }}>
              This dashboard is part of the {hubTitle} capability suite. Detailed
              functionality for &ldquo;{item.title}&rdquo; ({group.title}) is being
              built out next.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: "flex", flexDirection: "column", minHeight: "100vh" },
  main: { padding: "48px 40px 60px", maxWidth: 1200, width: "100%", margin: "0 auto" },
  breadcrumb: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    color: "var(--text-muted)",
    marginBottom: 14,
  },
  crumbLink: { color: "var(--teal-400)", textDecoration: "none" },
  h1: { fontSize: 36, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 24px" },
  placeholder: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--text-muted)",
    background: "var(--navy-900)",
    border: "1px dashed var(--border)",
    borderRadius: 12,
  },
};
