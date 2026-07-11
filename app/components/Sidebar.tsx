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
              <div style={pillStyle(false, "var(--teal-400)")}>
                <span>Overview</span>
              </div>
            </Link>
          )}

          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const active = variant === "root" && activeView === cat;
            const content = (
              <>
                <span style={{ fontSize: 14 }}>{meta.icon}</span>
                <span>{meta.short}</span>
                {variant === "root" && <span style={styles.pillCount}>{categoryCounts?.[cat] ?? 0}</span>}
              </>
            );
            if (variant === "root") {
              return (
                <button key={cat} onClick={() => onSelectView?.(cat)} style={pillStyle(active, meta.accent)}>
                  {content}
                </button>
              );
            }
            return (
              <Link key={cat} href="/" style={{ textDecoration: "none" }}>
                <div style={pillStyle(false, meta.accent)}>{content}</div>
              </Link>
            );
          })}

          <Link href="/water-systems" style={{ textDecoration: "none" }}>
            <div style={pillStyle(variant === "water-systems", "#22d3ee")}>
              <span style={{ fontSize: 14 }}>{"\u{1F4A7}"}</span>
              <span>Municipal Water Systems</span>
              <span style={styles.pillCount}>{TOTAL_CAPABILITY_COUNT}</span>
            </div>
          </Link>
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
