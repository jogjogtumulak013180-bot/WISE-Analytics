import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import { findCapability } from "../../../lib/waterSystems";
import GisDesigner from "../../../components/GisDesigner";
import EpanetDesigner from "../../../components/EpanetDesigner";

export default function CapabilityDashboard({
  params,
}: {
  params: { group: string; item: string };
}) {
  const found = findCapability(params.group, params.item);
  if (!found) return notFound();
  const { group, item } = found;

  return (
    <div style={styles.shell}>
      <Sidebar variant="water-systems" />

      <main style={styles.main}>
        <div style={styles.breadcrumb}>
          <Link href="/water-systems" style={styles.crumbLink}>
            Municipal Water Systems
          </Link>
          <span style={{ margin: "0 6px" }}>/</span>
          <span>{group.title}</span>
        </div>

        <h1 style={styles.h1}>{item.title}</h1>

        {item.slug === "interactive-gis-designer" ? (
          <GisDesigner />
        ) : item.slug === "epanet-designer" ? (
          <EpanetDesigner />
        ) : (
          <div style={styles.placeholder}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{"\u{1F6A7}"}</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Coming soon</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 480 }}>
              This dashboard is part of the Municipal Water Systems capability suite.
              Detailed functionality for &ldquo;{item.title}&rdquo; ({group.title}) is
              being built out next.
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
