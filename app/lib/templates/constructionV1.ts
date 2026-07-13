import type { TemplateDef } from "./types";
import { num, rate } from "./types";

// Grounded in Files/Construction Project Management/Program of Works_3storey_bldg.xlsx
// (POW cost-component columns, hierarchical BOQ, DUPA material/equipment/manpower lines).
// Indirect-cost rates are read from the project's general_info (defaults match the
// sample workbook: M/D 1%, OCM 12%, Profit 8%, VAT 5%) — never hard-coded.

const directCost = (r: Record<string, unknown>) => {
  const m = num(r, "materials");
  const e = num(r, "equipment");
  const p = num(r, "manpower");
  if (m === null || e === null || p === null) return null;
  return m + e + p;
};

export const CONSTRUCTION_DELIVERY_V1: TemplateDef = {
  code: "construction-delivery-v1",
  title: "Construction — Project Delivery Data Template v1",
  pillar: "construction",
  subPillar: "project-delivery",
  fileName: "WISE_ConstructionDelivery_Template_v1.xlsx",
  projectFields: [
    { key: "contract_amount", label: "Contract Amount (₱)", kind: "number" },
    { key: "contractor", label: "Contractor", kind: "text" },
    { key: "ntp_date", label: "Notice to Proceed (yyyy-mm-dd)", kind: "text" },
    { key: "duration_days", label: "Contract Duration (calendar days)", kind: "number" },
    { key: "md_rate", label: "Mob/Demob Rate (default 0.01)", kind: "number" },
    { key: "ocm_rate", label: "OCM Rate (default 0.12)", kind: "number" },
    { key: "profit_rate", label: "Profit Rate (default 0.08)", kind: "number" },
    { key: "vat_rate", label: "VAT Rate (default 0.05)", kind: "number" },
  ],
  sheets: [
    {
      name: "POW",
      layout: "long",
      columns: [
        { key: "item_no", header: "ITEM NO.", type: "text", required: true, note: "e.g., I.1, II.3 — TOTAL rows are ignored" },
        { key: "description", header: "DESCRIPTION", type: "text", required: true },
        { key: "qty", header: "QUANTITY", type: "number", required: true, min: 0 },
        { key: "unit", header: "UNIT", type: "text", required: true, note: "e.g., cu.m., sq.m., lot, months" },
        {
          key: "unit_cost", header: "UNIT COST", type: "number", required: true, min: 0,
          derive: (r) => {
            const a = num(r, "amount"); const q = num(r, "qty");
            return a !== null && q !== null && q > 0 ? a / q : null;
          },
        },
        {
          key: "amount", header: "AMOUNT", type: "number", required: true, min: 0,
          derive: (r) => {
            const q = num(r, "qty"); const u = num(r, "unit_cost");
            return q !== null && u !== null ? q * u : null;
          },
        },
        { key: "materials", header: "MATERIALS", type: "number", required: false, min: 0 },
        { key: "equipment", header: "EQUIPMENT", type: "number", required: false, min: 0 },
        { key: "manpower", header: "MANPOWER", type: "number", required: false, min: 0 },
        {
          key: "mob_demob", header: "M/D", type: "number", required: false, min: 0,
          derive: (r, ctx) => { const d = directCost(r); return d === null ? null : rate(ctx, "md_rate", 0.01) * d; },
          note: "M/D rate × direct cost",
        },
        {
          key: "ocm", header: "OCM", type: "number", required: false, min: 0,
          derive: (r, ctx) => { const d = directCost(r); return d === null ? null : rate(ctx, "ocm_rate", 0.12) * d; },
          note: "OCM rate × direct cost",
        },
        {
          key: "profit", header: "PROFIT", type: "number", required: false, min: 0,
          derive: (r, ctx) => { const d = directCost(r); return d === null ? null : rate(ctx, "profit_rate", 0.08) * d; },
          note: "Profit rate × direct cost",
        },
        {
          key: "vat", header: "VAT", type: "number", required: false, min: 0,
          derive: (r, ctx) => {
            const d = directCost(r); const o = num(r, "ocm"); const p = num(r, "profit");
            return d === null || o === null || p === null ? null : rate(ctx, "vat_rate", 0.05) * (d + o + p);
          },
          note: "VAT rate × (direct + OCM + profit)",
        },
        {
          key: "total_amount", header: "TOTAL AMOUNT", type: "number", required: false, min: 0,
          derive: (r) => {
            const d = directCost(r); const md = num(r, "mob_demob"); const o = num(r, "ocm");
            const p = num(r, "profit"); const v = num(r, "vat");
            return d === null || md === null || o === null || p === null || v === null
              ? null : d + md + o + p + v;
          },
          note: "direct + M/D + OCM + profit + VAT",
        },
      ],
      exampleRows: [["I.1", "Health & Safety", 6, "months", 4200, 25200, 24000, 0, 0, 0, 0, 0, 1200, 25200]],
    },
    {
      name: "BOQ",
      layout: "long",
      columns: [
        { key: "item_no", header: "ITEM NO.", type: "text", required: false, note: "division/item code; blank for sub-lines" },
        { key: "description", header: "DESCRIPTION", type: "text", required: true },
        { key: "qty", header: "QUANTITY", type: "number", required: true, min: 0 },
        { key: "unit", header: "UNIT", type: "text", required: true },
        { key: "unit_cost", header: "UNIT COST", type: "number", required: true, min: 0 },
        {
          key: "amount", header: "AMOUNT", type: "number", required: false, min: 0,
          derive: (r) => {
            const q = num(r, "qty"); const u = num(r, "unit_cost");
            return q !== null && u !== null ? q * u : null;
          },
          note: "qty × unit cost; auto-recomputed if broken",
        },
      ],
      exampleRows: [["A.1", "Mobilization/Demobilization", 1, "lot", 165000, 165000]],
    },
    {
      name: "DUPA",
      layout: "long",
      columns: [
        { key: "item_no", header: "ITEM NO.", type: "text", required: true, note: "work item this line belongs to" },
        {
          key: "resource_type", header: "RESOURCE", type: "enum", required: true,
          enumValues: ["materials", "equipment", "manpower"],
        },
        { key: "description", header: "DESCRIPTION", type: "text", required: true },
        { key: "qty", header: "QTY", type: "number", required: true, min: 0 },
        { key: "unit", header: "UNIT", type: "text", required: false, note: "materials only" },
        { key: "rate", header: "UNIT COST / RATE PER DAY", type: "number", required: true, min: 0 },
        { key: "days", header: "NO. OF DAYS", type: "number", required: false, min: 0, note: "equipment/manpower only" },
        {
          key: "amount", header: "AMOUNT", type: "number", required: false, min: 0,
          derive: (r) => {
            const q = num(r, "qty"); const rt = num(r, "rate"); const d = num(r, "days");
            if (q === null || rt === null) return null;
            return d !== null ? q * rt * d : q * rt;
          },
          note: "qty × rate (× days for equipment/manpower)",
        },
      ],
      exampleRows: [
        ["IV.1", "materials", "25mm dia Def Bars, Grade 40", 1, "lumpsum", 250000, "", 250000],
        ["IV.1", "manpower", "Skilled Labor", 10, "", 600, 22, 132000],
      ],
    },
    {
      name: "VariationOrders",
      layout: "long",
      columns: [
        { key: "vo_no", header: "VO NO.", type: "text", required: true },
        { key: "vo_date", header: "DATE", type: "date", required: true },
        { key: "description", header: "DESCRIPTION", type: "text", required: true },
        { key: "amount", header: "AMOUNT (+/-)", type: "number", required: true, note: "negative for deductive VOs" },
        { key: "time_extension_days", header: "TIME EXTENSION (DAYS)", type: "number", required: false, min: 0 },
        { key: "status", header: "STATUS", type: "enum", required: false, enumValues: ["proposed", "approved", "disapproved"] },
      ],
      exampleRows: [["VO-01", "2025-03-12", "Additional footing works", 250000, 15, "approved"]],
    },
    {
      name: "QualityTests",
      layout: "long",
      columns: [
        { key: "test_date", header: "DATE", type: "date", required: true },
        { key: "item_no", header: "ITEM NO.", type: "text", required: false },
        { key: "test_type", header: "TEST TYPE", type: "text", required: true, note: "e.g., concrete cylinder, CBR, weld test" },
        { key: "result", header: "RESULT", type: "text", required: false },
        { key: "passed", header: "PASSED", type: "enum", required: true, enumValues: ["yes", "no"] },
        { key: "remarks", header: "REMARKS", type: "text", required: false },
      ],
      exampleRows: [["2025-02-20", "IV.2", "Concrete cylinder (3000 psi, 28-day)", "3150 psi", "yes", ""]],
    },
  ],
};

export const CONSTRUCTION_SCHEDULE_V1: TemplateDef = {
  code: "construction-schedule-v1",
  title: "Construction — Schedule & Cost Control Data Template v1",
  pillar: "construction",
  subPillar: "schedule-cost-control",
  fileName: "WISE_ConstructionSchedule_Template_v1.xlsx",
  projectFields: [
    { key: "contract_amount", label: "Contract Amount (₱)", kind: "number" },
    { key: "ntp_date", label: "Notice to Proceed (yyyy-mm-dd)", kind: "text" },
    { key: "duration_days", label: "Contract Duration (calendar days)", kind: "number" },
  ],
  sheets: [
    {
      name: "Progress",
      layout: "long",
      columns: [
        { key: "period", header: "PERIOD (MONTH)", type: "date", required: true, note: "reporting month, e.g., 2025-03" },
        { key: "item_no", header: "ITEM NO.", type: "text", required: true, note: "matches POW/BOQ item numbers" },
        { key: "planned_pct", header: "PLANNED %", type: "number", required: true, min: 0, max: 100, note: "cumulative planned accomplishment" },
        { key: "actual_pct", header: "ACTUAL %", type: "number", required: false, min: 0, max: 100, note: "cumulative actual accomplishment" },
        { key: "actual_cost", header: "ACTUAL COST", type: "number", required: false, min: 0 },
      ],
      exampleRows: [["2025-03", "IV.1", 45, 41.5, 812000]],
    },
    {
      name: "SafetyLog",
      layout: "long",
      columns: [
        { key: "log_date", header: "DATE", type: "date", required: true },
        { key: "incident_type", header: "INCIDENT TYPE", type: "enum", required: true, enumValues: ["near-miss", "first-aid", "lost-time", "property-damage", "toolbox-meeting", "inspection"] },
        { key: "severity", header: "SEVERITY", type: "enum", required: false, enumValues: ["low", "medium", "high"] },
        { key: "manhours_lost", header: "MANHOURS LOST", type: "number", required: false, min: 0 },
        { key: "remarks", header: "REMARKS", type: "text", required: false },
      ],
      exampleRows: [["2025-02-10", "toolbox-meeting", "low", 0, "Weekly safety orientation"]],
    },
    {
      name: "PunchList",
      layout: "long",
      columns: [
        { key: "ref_no", header: "REF NO.", type: "text", required: true },
        { key: "location", header: "LOCATION", type: "text", required: true },
        { key: "description", header: "DESCRIPTION", type: "text", required: true },
        { key: "raised_date", header: "DATE RAISED", type: "date", required: true },
        { key: "closed_date", header: "DATE CLOSED", type: "date", required: false },
        { key: "status", header: "STATUS", type: "enum", required: false, enumValues: ["open", "closed"] },
      ],
      exampleRows: [["PL-001", "2F Column C-3", "Honeycomb on column face", "2025-04-02", "2025-04-09", "closed"]],
    },
    {
      name: "AsBuiltRegister",
      layout: "long",
      columns: [
        { key: "doc_no", header: "DOC NO.", type: "text", required: true },
        { key: "title", header: "TITLE", type: "text", required: true },
        { key: "discipline", header: "DISCIPLINE", type: "enum", required: false, enumValues: ["architectural", "structural", "electrical", "sanitary/plumbing", "mechanical"] },
        { key: "revision", header: "REVISION", type: "text", required: false },
        { key: "submitted_date", header: "DATE SUBMITTED", type: "date", required: false },
        { key: "status", header: "STATUS", type: "enum", required: false, enumValues: ["draft", "submitted", "approved"] },
      ],
      exampleRows: [["AB-S-001", "As-built foundation plan", "structural", "Rev 1", "2025-06-15", "approved"]],
    },
  ],
};
