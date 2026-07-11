"use client";

import Link from "next/link";
import { CATEGORIES, type ProjectCategory } from "../lib/supabase";
import { TOTAL_CAPABILITY_COUNT } from "../lib/waterSystems";

type View = "Overview" | ProjectCategory;

const CATEGORY_META: Record<ProjectCategory, { short: string; icon: string; accent: string }> = {
  "Construction Management": { short: "Construction", icon: "\u{1F3D7}️", accent: "#f59e0b" },
  "Local Development Planning": { short: "Dev Planning", icon: "\u{1F5FA}️", accent: "#34d399" },
  "Municipal Intelligence": { short: "Municipal Intel", icon: "\u{1F3DB}️", accent: "#a78bfa" },
};

interface SidebarProps {
  variant: "root" | "water-systems";
  activeView?: View;
  onSelectView?: (view: View) => void;
  overviewCount?: number;
  categoryCounts?: Partial<Record<ProjectCategory, number>>;
}

export default function Sidebar({
  variant,
  activeView,
  onSelectView,
  overviewCount,
  categoryCounts,
}: SidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <img src="/logo.png" alt="WISE Analytics — Intelligence for Better Decisions" style={styles.brandMark} />
        <div style={styles.brandSub}>Project Tracker</div>
      </div>

      <nav style={styles.nav}>
        {variant === "root" ? (
          <button
            onClick={() => onSelectView?.("Overview")}
            style={navItemStyle(activeView === "Overview", "var(--teal-400)")}
          >
            <span style={{ flex: 1, textAlign: "left" }}>Overview</span>
            <span style={styles.navCount}>{overviewCount ?? 0}</span>
          </button>
        ) : (
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={navItemStyle(false, "var(--teal-400)")}>
              <span style={{ flex: 1, textAlign: "left" }}>Overview</span>
            </div>
          </Link>
        )}

        {CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const active = variant === "root" && activeView === cat;
          const content = (
            <>
              <span style={{ fontSize: 16 }}>{meta.icon}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{meta.short}</span>
              {variant === "root" && (
                <span style={styles.navCount}>{categoryCounts?.[cat] ?? 0}</span>
              )}
            </>
          );
          if (variant === "root") {
            return (
              <button key={cat} onClick={() => onSelectView?.(cat)} style={navItemStyle(active, meta.accent)}>
                {content}
              </button>
            );
          }
          return (
            <Link key={cat} href="/" style={{ textDecoration: "none" }}>
              <div style={navItemStyle(false, meta.accent)}>{content}</div>
            </Link>
          );
        })}

        <Link href="/water-systems" style={{ textDecoration: "none" }}>
          <div style={navItemStyle(variant === "water-systems", "#22d3ee")}>
            <span style={{ fontSize: 16 }}>{"\u{1F4A7}"}</span>
            <span style={{ flex: 1, textAlign: "left" }}>Municipal Water Systems</span>
            <span style={styles.navCount}>{TOTAL_CAPABILITY_COUNT}</span>
          </div>
        </Link>
      </nav>

      <div style={styles.sidebarFooter}>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Internal tool &middot; not connected to wiseanalyticsph.com
        </div>
      </div>
    </aside>
  );
}

function navItemStyle(active: boolean, accent: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    width: "100%",
    background: active ? "var(--navy-800)" : "transparent",
    borderLeft: active ? `3px solid ${accent}` : "3px solid transparent",
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
  };
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "20px 14px",
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "12px 8px 20px",
    marginBottom: 12,
    borderBottom: "1px solid var(--border)",
  },
  brandMark: {
    width: 148,
    height: "auto",
    objectFit: "contain",
    flexShrink: 0,
  },
  brandSub: { fontSize: 11, color: "var(--text-muted)", letterSpacing: 0.4 },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navCount: {
    fontSize: 11,
    color: "var(--text-muted)",
    background: "var(--navy-800)",
    borderRadius: 10,
    padding: "1px 8px",
  },
  sidebarFooter: { marginTop: "auto", padding: "12px 8px" },
};
