// Template engine — single source of truth per template for:
// (a) generating the downloadable XLSX, (b) validating + cleaning uploads,
// (c) mapping cleaned rows to core tables (promotion happens in Postgres RPC).
//
// Cleaning is three-tier (see docs/DATA_ANALYTICS_DESIGN.md):
//   tier 1 auto-clean  — silent, logged: coercion, case-fold enums, N/A→NULL, dates
//   tier 2 auto-repair — recompute broken derived cells (template formula rules)
//   tier 3 uncleanable — row quarantined (needs_review), file still promotes

export type ColType = "text" | "number" | "date" | "enum";

export interface ColumnDef {
  key: string; // canonical key in the cleaned row
  header: string; // exact column header in the template sheet
  type: ColType;
  required: boolean;
  /** key inside wa_projects.general_info holding the canonical enum list */
  enumSource?: string;
  /** static canonical enum values */
  enumValues?: string[];
  min?: number;
  max?: number;
  /**
   * Tier-2 repair: when this cell is broken (#REF!, blank, non-numeric) but the
   * row's other cells are clean, recompute it from them. Return null when the
   * inputs needed are themselves missing (cell stays broken → quarantine).
   */
  derive?: (row: Record<string, unknown>, ctx: CleanContext) => number | null;
  /** short human note shown in the requirements table */
  note?: string;
}

export interface SheetDef {
  name: string;
  /**
   * "long": one record per row.
   * "wide-months": identity columns + JAN..DEC columns; each month cell
   * unpivots to its own record with `period` + `valueKey`.
   */
  layout: "long" | "wide-months";
  columns: ColumnDef[]; // for wide-months: identity columns only
  /** wide-months: canonical key the month cell value lands in */
  valueKey?: string;
  /** wide-months: value must be >= 0 etc. */
  valueMin?: number;
  exampleRows?: (string | number)[][];
  /**
   * Tier-2 repair hook: given a cleaned row, recompute derived fields.
   * Returns repairs performed. (Used by construction templates.)
   */
  derive?: (row: Record<string, unknown>) => RepairEntry[];
}

export interface TemplateDef {
  code: string;
  title: string;
  pillar: string;
  subPillar: string;
  fileName: string;
  /** general_info fields the New Project form must collect for this template */
  projectFields: { key: string; label: string; kind: "text" | "number" | "list" }[];
  sheets: SheetDef[];
}

export interface CleanIssue {
  col: string;
  rule: string;
  message: string;
}

export interface RepairEntry {
  col: string;
  rule: string;
  old: string;
  new: string;
}

export interface CleanedRecord {
  sheet: string;
  rowNum: number;
  raw: Record<string, unknown>;
  clean: Record<string, unknown> | null;
  errors: CleanIssue[];
  repairs: RepairEntry[];
  isValid: boolean;
  needsReview: boolean;
}

export interface StructuralError {
  sheet: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Tier-1 cleaners
// ---------------------------------------------------------------------------

const NULLISH = new Set(["", "n/a", "na", "-", "—", "null", "none"]);
const BROKEN_FORMULA = /^#(ref|div\/0|value|name|num|n\/a)!?$/i;

export function isNullish(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  return NULLISH.has(String(v).trim().toLowerCase());
}

export function isBrokenFormula(v: unknown): boolean {
  return typeof v === "string" && BROKEN_FORMULA.test(v.trim());
}

/** "1,234.50", "₱ 1,234", "85%" → number; returns null when unparseable */
export function coerceNumber(v: unknown): { value: number | null; changed: boolean } {
  if (typeof v === "number") return { value: v, changed: false };
  if (v === null || v === undefined) return { value: null, changed: false };
  const s0 = String(v).trim();
  const pct = s0.endsWith("%");
  const s = s0
    .replace(/%$/, "")
    .replace(/[₱$]|php/gi, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "");
  if (s === "") return { value: null, changed: false };
  const n = Number(s);
  if (!Number.isFinite(n)) return { value: null, changed: false };
  return { value: pct ? n / 100 : n, changed: s !== s0 || typeof v !== "number" };
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

export const MONTH_HEADERS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Accepts Date, Excel serial, "Jan"/"JANUARY" (+ defaultYear), "2025-01",
 * "1/2025", "2025-01-15", "15/01/2025" → "yyyy-mm-dd".
 */
export function coerceDate(
  v: unknown,
  defaultYear?: number
): { value: string | null; changed: boolean } {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return {
      value: `${v.getFullYear()}-${pad2(v.getMonth() + 1)}-${pad2(v.getDate())}`,
      changed: false,
    };
  }
  if (typeof v === "number" && Number.isFinite(v) && v > 25569 && v < 80000) {
    // Excel serial date (days since 1899-12-30)
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return {
      value: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
      changed: true,
    };
  }
  if (v === null || v === undefined) return { value: null, changed: false };
  const s = String(v).trim();
  if (s === "") return { value: null, changed: false };

  const monthOnly = MONTHS[s.toLowerCase()];
  if (monthOnly && defaultYear) {
    return { value: `${defaultYear}-${pad2(monthOnly)}-01`, changed: true };
  }
  let m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/); // 2025-01[-15]
  if (m) {
    return {
      value: `${m[1]}-${pad2(+m[2])}-${pad2(m[3] ? +m[3] : 1)}`,
      changed: !m[3] || m[2].length === 1,
    };
  }
  m = s.match(/^(\d{1,2})\/(\d{4})$/); // 1/2025
  if (m) return { value: `${m[2]}-${pad2(+m[1])}-01`, changed: true };
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // d/m/yyyy
  if (m) return { value: `${m[3]}-${pad2(+m[2])}-${pad2(+m[1])}`, changed: true };
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return {
      value: `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`,
      changed: true,
    };
  }
  return { value: null, changed: false };
}

/** trim + case-fold match against canonical list → canonical value */
export function normalizeEnum(
  v: unknown,
  canonical: string[]
): { value: string | null; changed: boolean } {
  if (v === null || v === undefined) return { value: null, changed: false };
  const s = String(v).trim();
  if (s === "") return { value: null, changed: false };
  const hit = canonical.find((c) => c.trim().toLowerCase() === s.toLowerCase());
  if (hit === undefined) return { value: null, changed: false };
  return { value: hit, changed: hit !== String(v) };
}

// ---------------------------------------------------------------------------
// Row cleaning
// ---------------------------------------------------------------------------

export interface CleanContext {
  /** wa_projects.general_info — canonical enum lists, reporting_year, etc. */
  generalInfo: Record<string, unknown>;
}

/** helper for derive() rules: numeric value of a cleaned cell, or null */
export function num(row: Record<string, unknown>, key: string): number | null {
  const v = row[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** helper for derive() rules: rate from general_info with a default */
export function rate(ctx: CleanContext, key: string, fallback: number): number {
  const v = Number(ctx.generalInfo[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function enumList(col: ColumnDef, ctx: CleanContext): string[] | null {
  if (col.enumValues) return col.enumValues;
  if (col.enumSource) {
    const v = ctx.generalInfo[col.enumSource];
    if (Array.isArray(v)) return v.map(String);
  }
  return null;
}

export function cleanCell(
  col: ColumnDef,
  rawVal: unknown,
  ctx: CleanContext
): {
  value: unknown;
  error?: CleanIssue;
  repair?: RepairEntry;
} {
  const year = Number(ctx.generalInfo["reporting_year"]) || undefined;

  if (isBrokenFormula(rawVal)) {
    return {
      value: null,
      error: {
        col: col.key,
        rule: "broken_formula",
        message: `"${String(rawVal)}" cannot be recomputed from this row's inputs`,
      },
    };
  }

  if (isNullish(rawVal)) {
    if (col.required) {
      return {
        value: null,
        error: { col: col.key, rule: "required", message: "required value is missing" },
      };
    }
    const changed = !(rawVal === null || rawVal === undefined || rawVal === "");
    return {
      value: null,
      repair: changed
        ? { col: col.key, rule: "null_normalized", old: String(rawVal), new: "NULL" }
        : undefined,
    };
  }

  switch (col.type) {
    case "number": {
      const { value, changed } = coerceNumber(rawVal);
      if (value === null) {
        return {
          value: null,
          error: {
            col: col.key,
            rule: "not_numeric",
            message: `"${String(rawVal)}" is not a number`,
          },
        };
      }
      if (col.min !== undefined && value < col.min) {
        return {
          value: null,
          error: { col: col.key, rule: "below_min", message: `${value} < ${col.min}` },
        };
      }
      if (col.max !== undefined && value > col.max) {
        return {
          value: null,
          error: { col: col.key, rule: "above_max", message: `${value} > ${col.max}` },
        };
      }
      return {
        value,
        repair: changed
          ? { col: col.key, rule: "number_coerced", old: String(rawVal), new: String(value) }
          : undefined,
      };
    }
    case "date": {
      const { value, changed } = coerceDate(rawVal, year);
      if (value === null) {
        return {
          value: null,
          error: {
            col: col.key,
            rule: "bad_date",
            message: `"${String(rawVal)}" is not a recognizable date`,
          },
        };
      }
      return {
        value,
        repair: changed
          ? { col: col.key, rule: "date_normalized", old: String(rawVal), new: value }
          : undefined,
      };
    }
    case "enum": {
      const list = enumList(col, ctx);
      if (!list || list.length === 0) {
        // no canonical list declared — accept trimmed text
        const s = String(rawVal).trim();
        return {
          value: s,
          repair:
            s !== String(rawVal)
              ? { col: col.key, rule: "trimmed", old: String(rawVal), new: s }
              : undefined,
        };
      }
      const { value, changed } = normalizeEnum(rawVal, list);
      if (value === null) {
        return {
          value: null,
          error: {
            col: col.key,
            rule: "unknown_enum",
            message: `"${String(rawVal)}" not in declared list: ${list.join(", ")}`,
          },
        };
      }
      return {
        value,
        repair: changed
          ? { col: col.key, rule: "enum_normalized", old: String(rawVal), new: value }
          : undefined,
      };
    }
    default: {
      const s = String(rawVal).trim();
      return {
        value: s,
        repair:
          s !== String(rawVal)
            ? { col: col.key, rule: "trimmed", old: String(rawVal), new: s }
            : undefined,
      };
    }
  }
}
