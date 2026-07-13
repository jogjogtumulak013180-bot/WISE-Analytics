"use client";

import type { TemplateDef } from "../lib/templates/types";
import { columnRules } from "../lib/importer";
import { MONTH_HEADERS } from "../lib/templates/types";

/** Column + data-type contract for a template, rendered per sheet. */
export default function RequirementsTable({ template }: { template: TemplateDef }) {
  return (
    <div>
      {template.sheets.map((s) => (
        <div key={s.name} style={styles.sheetBlock}>
          <div style={styles.sheetTitle}>
            Sheet: <span style={{ color: "var(--teal-400)" }}>{s.name}</span>
            {s.layout === "wide-months" && (
              <span style={styles.badge}>+ JAN…DEC month columns</span>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Column</th>
                  <th style={styles.th}>Data Type</th>
                  <th style={styles.th}>Required</th>
                  <th style={styles.th}>Allowed Values / Rules</th>
                  <th style={styles.th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {s.columns.map((c) => (
                  <tr key={c.key}>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{c.header}</td>
                    <td style={styles.td}>{c.type}</td>
                    <td style={{ ...styles.td, color: c.required ? "#f59e0b" : "var(--text-muted)" }}>
                      {c.required ? "YES" : "no"}
                    </td>
                    <td style={styles.td}>{columnRules(c)}</td>
                    <td style={styles.td}>{c.note ?? ""}</td>
                  </tr>
                ))}
                {s.layout === "wide-months" && (
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 700 }}>
                      {MONTH_HEADERS[0]} … {MONTH_HEADERS[11]}
                    </td>
                    <td style={styles.td}>number</td>
                    <td style={{ ...styles.td, color: "var(--text-muted)" }}>no</td>
                    <td style={styles.td}>
                      {s.valueMin !== undefined ? `>= ${s.valueMin}; ` : ""}
                      blank = not yet reported; commas/₱ accepted
                    </td>
                    <td style={styles.td}>
                      each month value becomes one {s.valueKey ?? "value"} record
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div style={styles.footnote}>
        Cleaning is automatic: capitalization/spacing is normalized against your
        project&rsquo;s declared lists, N/A and &ldquo;-&rdquo; become empty (optional fields
        only), numbers with commas/₱/% are converted, and broken derived cells
        (#REF!) are recomputed where marked. Rows that cannot be cleaned are
        quarantined for review — the rest of the file still imports. TOTAL rows
        are ignored (totals are always computed by the app).
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sheetBlock: { marginBottom: 18 },
  sheetTitle: { fontSize: 13, fontWeight: 800, marginBottom: 8 },
  badge: {
    marginLeft: 10,
    fontSize: 11,
    fontWeight: 700,
    color: "var(--navy-950)",
    background: "var(--cyan-400)",
    borderRadius: 6,
    padding: "2px 8px",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 },
  th: {
    textAlign: "left",
    padding: "7px 10px",
    borderBottom: "1px solid var(--border)",
    color: "var(--text-muted)",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "7px 10px",
    borderBottom: "1px solid rgba(148,163,184,.08)",
    verticalAlign: "top",
  },
  footnote: {
    fontSize: 12,
    color: "var(--text-muted)",
    lineHeight: 1.55,
    borderTop: "1px solid var(--border)",
    paddingTop: 10,
  },
};
