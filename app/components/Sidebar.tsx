"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProjectCategory } from "../lib/supabase";
import { TOTAL_CAPABILITY_COUNT } from "../lib/waterSystems";
import { CONSTRUCTION_MANAGEMENT_TOTAL_COUNT } from "../lib/constructionManagement";
import { DEV_PLANNING_TOTAL_COUNT } from "../lib/devPlanning";
import { MUNICIPAL_INTEL_TOTAL_COUNT } from "../lib/municipalIntel";

type View = "Overview" | ProjectCategory;

const PRODUCT_LINKS = [
  { href: "/construction", label: "Construction", icon: "\u{1F3D7}️", accent: "#f59e0b", count: CONSTRUCTION_MANAGEMENT_TOTAL_COUNT },
  { href: "/dev-planning", label: "Dev Planning", icon: "\u{1F5FA}️", accent: "#34d399", count: DEV_PLANNING_TOTAL_COUNT },
  { href: "/municipal-intel", label: "Municipal Intel", icon: "\u{1F3DB}️", accent: "#a78bfa", count: MUNICIPAL_INTEL_TOTAL_COUNT },
  { href: "/water-systems", label: "Municipal Water Systems", icon: "\u{1F4A7}", accent: "#22d3ee", count: TOTAL_CAPABILITY_COUNT },
];

interface SidebarProps {
  variant: "root" | "secondary";
  activeView?: View;
  onSelectView?: (view: View) => void;
  overviewCount?: number;
}

export default function Sidebar({ variant, activeView, onSelectView, overviewCount }: SidebarProps) {
  const pathname = usePathname();

  return (
    <header style={styles.navbar}>
      <div style={styles.row}>
        <div style={styles.brandRow}>
          <img src="/logo.png" alt="WISE Analytics — Intelligence for Better Decisions" style={styles.brandMark} />
          <div style={styles.brandTextWrap}>
            <span style={styles.brandLabel}>Project Tracker</span>
            <span style={styles.brandDot} />
          </div>
        </div>

        <nav style={styles.pillRow}>
          {variant === "root" ? (
            <button
              onClick={() => onSelectView?.("Overview")}
              style={pillStyle(activeView === "Overview", "var(--teal-400)")}
            >
              <span>Overview</span>
              <span style={styles.pillCount}>{overviewCount ?? 0}</span>
            </button>
          ) : (
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={pillStyle(pathname === "/", "var(--teal-400)")}>
                <span>Overview</span>
              </div>
            </Link>
          )}

          {PRODUCT_LINKS.map((p) => (
            <Link key={p.href} href={p.href} style={{ textDecoration: "none" }}>
              <div style={pillStyle(pathname?.startsWith(p.href) ?? false, p.accent)}>
                <span style={{ fontSize: 14 }}>{p.icon}</span>
                <span>{p.label}</span>
                <span style={styles.pillCount}>{p.count}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function pillStyle(active: boolean, accent: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? accent : "var(--border)"}`,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
    flexShrink: 0,
    background: active ? `${accent}1a` : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
  };
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    width: "100%",
    borderBottom: "1px solid var(--border)",
    padding: "16px 40px",
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "var(--navy-950)",
    overflowX: "auto",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    flexWrap: "nowrap",
    minWidth: "max-content",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  brandMark: {
    width: 36,
    height: "auto",
    objectFit: "contain",
    flexShrink: 0,
  },
  brandTextWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  brandLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--teal-400)",
    flexShrink: 0,
  },
  pillRow: {
    display: "flex",
    flexWrap: "nowrap",
    gap: 6,
    justifyContent: "flex-end",
    flexShrink: 0,
  },
  pillCount: {
    fontSize: 10,
    fontWeight: 700,
    color: "inherit",
    background: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "1px 7px",
  },
};
