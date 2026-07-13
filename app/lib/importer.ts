import * as XLSX from "xlsx";
import type {
  CleanContext,
  CleanedRecord,
  CleanIssue,
  RepairEntry,
  SheetDef,
  StructuralError,
  TemplateDef,
} from "./templates/types";
import { cleanCell, coerceNumber, isBrokenFormula, isNullish, MONTH_HEADERS } from "./templates/types";

export interface ImportResult {
  structuralErrors: StructuralError[];
  records: CleanedRecord[];
  summary: {
    totalRows: number;
    validRows: number;
    repairedRows: number;
    quarantinedRows: number;
    repairs: number;
  };
}

function headersOf(sheetDef: SheetDef): string[] {
  const identity = sheetDef.columns.map((c) => c.header);
  return sheetDef.layout === "wide-months" ? [...identity, ...MONTH_HEADERS] : identity;
}

/** case-insensitive header lookup: template header → actual key in parsed row */
function buildHeaderMap(
  actualHeaders: string[],
  expected: string[]
): { map: Record<string, string>; missing: string[] } {
  const map: Record<string, string> = {};
  const missing: string[] = [];
  for (const exp of expected) {
    const hit = actualHeaders.find(
      (h) => h.trim().toLowerCase() === exp.trim().toLowerCase()
    );
    if (hit === undefined) missing.push(exp);
    else map[exp] = hit;
  }
  return { map, missing };
}

export function runImport(
  buf: Buffer,
  template: TemplateDef,
  ctx: CleanContext
): ImportResult {
  const structuralErrors: StructuralError[] = [];
  const records: CleanedRecord[] = [];

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  } catch {
    return {
      structuralErrors: [{ sheet: "*", message: "File is not a readable XLSX workbook" }],
      records: [],
      summary: { totalRows: 0, validRows: 0, repairedRows: 0, quarantinedRows: 0, repairs: 0 },
    };
  }

  for (const sheetDef of template.sheets) {
    const wsName = wb.SheetNames.find(
      (n) => n.trim().toLowerCase() === sheetDef.name.toLowerCase()
    );
    if (!wsName) {
      structuralErrors.push({
        sheet: sheetDef.name,
        message: `Missing sheet "${sheetDef.name}"`,
      });
      continue;
    }
    const ws = wb.Sheets[wsName];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
      raw: true,
      defval: null,
    });
    if (rows.length === 0) continue; // empty sheet is allowed (e.g., no leaks yet)

    const actualHeaders = Object.keys(rows[0]);
    const expected = headersOf(sheetDef);
    const { map, missing } = buildHeaderMap(actualHeaders, expected);
    if (missing.length > 0) {
      structuralErrors.push({
        sheet: sheetDef.name,
        message: `Missing column(s): ${missing.join(", ")}`,
      });
      continue;
    }

    rows.forEach((raw, i) => {
      const rowNum = i + 2; // 1-based + header row

      // skip fully-empty rows and TOTAL/summary rows (never imported — derived)
      const firstIdentity = raw[map[sheetDef.columns[0].header]];
      const allEmpty = expected.every((h) => isNullish(raw[map[h]]) );
      if (allEmpty) return;
      if (
        typeof firstIdentity === "string" &&
        /^\s*(grand\s+)?total\b/i.test(firstIdentity)
      ) {
        return;
      }

      if (sheetDef.layout === "long") {
        records.push(cleanLongRow(sheetDef, raw, map, rowNum, ctx));
      } else {
        records.push(...cleanWideRow(sheetDef, raw, map, rowNum, ctx));
      }
    });
  }

  const validRows = records.filter((r) => r.isValid).length;
  const repairedRows = records.filter((r) => r.isValid && r.repairs.length > 0).length;
  const quarantinedRows = records.filter((r) => r.needsReview).length;
  const repairs = records.reduce((s, r) => s + r.repairs.length, 0);

  return {
    structuralErrors,
    records,
    summary: { totalRows: records.length, validRows, repairedRows, quarantinedRows, repairs },
  };
}

function cleanLongRow(
  sheetDef: SheetDef,
  raw: Record<string, unknown>,
  map: Record<string, string>,
  rowNum: number,
  ctx: CleanContext
): CleanedRecord {
  const clean: Record<string, unknown> = {};
  let errors: CleanIssue[] = [];
  const repairs: RepairEntry[] = [];

  for (const col of sheetDef.columns) {
    const res = cleanCell(col, raw[map[col.header]], ctx);
    if (res.error) errors.push(res.error);
    if (res.repair) repairs.push(res.repair);
    clean[col.key] = res.value;
  }

  // tier-2: recompute broken derived cells from the row's clean inputs
  for (const col of sheetDef.columns) {
    if (!col.derive) continue;
    const err = errors.find((e) => e.col === col.key);
    if (!err) continue;
    const recomputed = col.derive(clean, ctx);
    if (recomputed !== null && Number.isFinite(recomputed)) {
      clean[col.key] = recomputed;
      errors = errors.filter((e) => e.col !== col.key);
      repairs.push({
        col: col.key,
        rule: "derived_recomputed",
        old: String(raw[map[col.header]] ?? ""),
        new: String(recomputed),
      });
    }
  }

  if (sheetDef.derive && errors.length === 0) {
    repairs.push(...sheetDef.derive(clean));
  }

  const isValid = errors.length === 0;
  return {
    sheet: sheetDef.name,
    rowNum,
    raw,
    clean: isValid ? clean : null,
    errors,
    repairs,
    isValid,
    needsReview: !isValid,
  };
}

/** wide-months: unpivot each month column into its own record */
function cleanWideRow(
  sheetDef: SheetDef,
  raw: Record<string, unknown>,
  map: Record<string, string>,
  rowNum: number,
  ctx: CleanContext
): CleanedRecord[] {
  const year = Number(ctx.generalInfo["reporting_year"]) || new Date().getFullYear();
  const identity: Record<string, unknown> = {};
  const idErrors: CleanIssue[] = [];
  const idRepairs: RepairEntry[] = [];

  for (const col of sheetDef.columns) {
    const res = cleanCell(col, raw[map[col.header]], ctx);
    if (res.error) idErrors.push(res.error);
    if (res.repair) idRepairs.push(res.repair);
    identity[col.key] = res.value;
  }

  // broken identity → quarantine the whole source row as one record
  if (idErrors.length > 0) {
    return [
      {
        sheet: sheetDef.name,
        rowNum,
        raw,
        clean: null,
        errors: idErrors,
        repairs: idRepairs,
        isValid: false,
        needsReview: true,
      },
    ];
  }

  const out: CleanedRecord[] = [];
  MONTH_HEADERS.forEach((mh, mi) => {
    const rawVal = raw[map[mh]];
    if (isNullish(rawVal) && !isBrokenFormula(rawVal)) return; // month not yet reported

    const period = `${year}-${String(mi + 1).padStart(2, "0")}-01`;
    const errors: CleanIssue[] = [];
    const repairs: RepairEntry[] = [...idRepairs];
    let value: number | null = null;

    if (isBrokenFormula(rawVal)) {
      errors.push({
        col: sheetDef.valueKey ?? "value",
        rule: "broken_formula",
        message: `"${String(rawVal)}" in ${mh} cannot be recomputed`,
      });
    } else {
      const { value: v, changed } = coerceNumber(rawVal);
      if (v === null) {
        errors.push({
          col: sheetDef.valueKey ?? "value",
          rule: "not_numeric",
          message: `"${String(rawVal)}" in ${mh} is not a number`,
        });
      } else if (sheetDef.valueMin !== undefined && v < sheetDef.valueMin) {
        errors.push({
          col: sheetDef.valueKey ?? "value",
          rule: "below_min",
          message: `${v} in ${mh} < ${sheetDef.valueMin}`,
        });
      } else {
        value = v;
        if (changed) {
          repairs.push({
            col: sheetDef.valueKey ?? "value",
            rule: "number_coerced",
            old: String(rawVal),
            new: String(v),
          });
        }
      }
    }

    const isValid = errors.length === 0;
    out.push({
      sheet: sheetDef.name,
      rowNum,
      raw: { ...raw, __month: mh },
      clean: isValid ? { ...identity, period, [sheetDef.valueKey ?? "value"]: value } : null,
      errors,
      repairs,
      isValid,
      needsReview: !isValid,
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Template workbook generation (download)
// ---------------------------------------------------------------------------

/** human-readable rule string for a column (shared by workbook + UI) */
export function columnRules(c: {
  type: string;
  enumValues?: string[];
  enumSource?: string;
  min?: number;
  max?: number;
  derive?: unknown;
}): string {
  const parts: string[] = [];
  if (c.enumValues) parts.push(`one of: ${c.enumValues.join(", ")}`);
  if (c.enumSource) parts.push(`must match the project's declared ${c.enumSource} (case-insensitive)`);
  if (c.min !== undefined && c.max !== undefined) parts.push(`${c.min} to ${c.max}`);
  else if (c.min !== undefined) parts.push(`>= ${c.min}`);
  else if (c.max !== undefined) parts.push(`<= ${c.max}`);
  if (c.type === "date") parts.push("accepts 2025-01-15, 15/01/2025, Jan, 2025-01");
  if (c.type === "number") parts.push("commas/₱/% accepted and normalized");
  if (c.derive) parts.push("auto-recomputed if broken (#REF!)");
  return parts.join("; ");
}

export function generateTemplateWorkbook(template: TemplateDef): Buffer {
  const wb = XLSX.utils.book_new();

  const readme: (string | number)[][] = [
    [template.title],
    [""],
    ["HOW TO USE"],
    ["1. Fill in each sheet. Do not rename sheets or column headers."],
    ["2. Month columns: leave blank if not yet reported. Numbers only."],
    ["3. Values like N/A, -, or blank are treated as no data (optional fields only)."],
    ["4. Names are matched case-insensitively against your project's declared lists."],
    ["5. TOTAL rows are ignored — totals are always computed by WISE Analytics."],
    ["6. Broken cells (#REF!, #DIV/0!) that cannot be recomputed are quarantined for review;"],
    ["   the rest of the file still imports."],
    [""],
    ["SHEETS"],
    ...template.sheets.map((s) => [
      `${s.name} — columns: ${headersOf(s).join(" | ")}`,
    ]),
  ];
  const wsReadme = XLSX.utils.aoa_to_sheet(readme);
  wsReadme["!cols"] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, wsReadme, "README");

  // Requirements sheet: column + data-type contract, one row per column
  const reqRows: (string | number)[][] = [
    ["SHEET", "COLUMN", "DATA TYPE", "REQUIRED", "ALLOWED VALUES / RULES", "NOTES"],
  ];
  for (const s of template.sheets) {
    for (const c of s.columns) {
      reqRows.push([
        s.name,
        c.header,
        c.type,
        c.required ? "YES" : "no",
        columnRules(c),
        c.note ?? "",
      ]);
    }
    if (s.layout === "wide-months") {
      reqRows.push([
        s.name,
        "JAN … DEC (12 columns)",
        "number",
        "no",
        s.valueMin !== undefined ? `>= ${s.valueMin}; blank = not yet reported` : "blank = not yet reported",
        `each month value becomes one ${s.valueKey ?? "value"} record`,
      ]);
    }
  }
  const wsReq = XLSX.utils.aoa_to_sheet(reqRows);
  wsReq["!cols"] = [{ wch: 18 }, { wch: 26 }, { wch: 10 }, { wch: 9 }, { wch: 48 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsReq, "Requirements");

  for (const sheetDef of template.sheets) {
    const headers = headersOf(sheetDef);
    const aoa: (string | number)[][] = [headers, ...(sheetDef.exampleRows ?? [])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, sheetDef.name);
  }

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
