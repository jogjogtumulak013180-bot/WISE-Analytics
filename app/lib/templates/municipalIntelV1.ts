import type { TemplateDef } from "./types";

// Municipal Intelligence templates v1 — CBMS/RCBMS-style indicator data per
// barangay, intervention/PPA tracking, scenario inputs, and agency report
// submissions. No sample files existed for this pillar; columns follow the
// CBMS core-indicator structure used in LGU planning offices. Refine per real data.

export const MI_NEEDS_V1: TemplateDef = {
  code: "mi-needs-v1",
  title: "Municipal Intelligence — Needs Analysis Data Template v1",
  pillar: "municipal-intel",
  subPillar: "needs-analysis",
  fileName: "WISE_NeedsAnalysis_Template_v1.xlsx",
  projectFields: [
    { key: "barangays", label: "Barangays (one per line)", kind: "list" },
    { key: "reference_year", label: "Reference Year (e.g., CBMS round)", kind: "number" },
  ],
  sheets: [
    {
      name: "Indicators",
      layout: "long",
      columns: [
        { key: "barangay", header: "BARANGAY", type: "enum", required: true, enumSource: "barangays" },
        { key: "indicator", header: "INDICATOR", type: "text", required: true, note: "e.g., HH without safe water, malnourished children 0-5" },
        { key: "sector", header: "SECTOR", type: "enum", required: false, enumValues: ["health", "education", "water-sanitation", "housing", "income", "food", "peace-order", "infrastructure"] },
        { key: "magnitude", header: "MAGNITUDE", type: "number", required: true, min: 0, note: "count of HH/persons affected" },
        { key: "total_universe", header: "TOTAL HH / POPULATION", type: "number", required: false, min: 0, note: "denominator for proportion" },
        { key: "year", header: "YEAR", type: "number", required: false, min: 1990, max: 2100 },
      ],
      exampleRows: [["Bagakay", "HH without access to safe water", "water-sanitation", 124, 320, 2024]],
    },
    {
      name: "Infrastructure",
      layout: "long",
      columns: [
        { key: "barangay", header: "BARANGAY", type: "enum", required: true, enumSource: "barangays" },
        { key: "facility_type", header: "FACILITY TYPE", type: "text", required: true, note: "e.g., health station, day care, water system level" },
        { key: "existing_count", header: "EXISTING", type: "number", required: true, min: 0 },
        { key: "required_count", header: "REQUIRED / STANDARD", type: "number", required: false, min: 0 },
        { key: "condition", header: "CONDITION", type: "enum", required: false, enumValues: ["good", "fair", "poor", "non-functional"] },
      ],
      exampleRows: [["Bagakay", "Barangay health station", 1, 1, "fair"]],
    },
  ],
};

export const MI_INTERVENTION_V1: TemplateDef = {
  code: "mi-intervention-v1",
  title: "Municipal Intelligence — Intervention Data Template v1",
  pillar: "municipal-intel",
  subPillar: "intervention",
  fileName: "WISE_Intervention_Template_v1.xlsx",
  projectFields: [
    { key: "barangays", label: "Barangays (one per line)", kind: "list" },
    { key: "fiscal_year", label: "Fiscal Year", kind: "number" },
  ],
  sheets: [
    {
      name: "Interventions",
      layout: "long",
      columns: [
        { key: "ppa", header: "INTERVENTION / PPA", type: "text", required: true },
        { key: "barangay", header: "BARANGAY", type: "enum", required: false, enumSource: "barangays", note: "blank = municipal-wide" },
        { key: "target_indicator", header: "TARGET INDICATOR", type: "text", required: true, note: "the needs indicator this addresses" },
        { key: "budget", header: "BUDGET (₱)", type: "number", required: true, min: 0 },
        { key: "target_beneficiaries", header: "TARGET BENEFICIARIES", type: "number", required: false, min: 0 },
        { key: "status", header: "STATUS", type: "enum", required: false, enumValues: ["proposed", "funded", "ongoing", "completed", "dropped"] },
        { key: "accomplishment_pct", header: "ACCOMPLISHMENT %", type: "number", required: false, min: 0, max: 100 },
        { key: "actual_beneficiaries", header: "ACTUAL BENEFICIARIES", type: "number", required: false, min: 0 },
      ],
      exampleRows: [["Level II water system expansion", "Bagakay", "HH without access to safe water", 3500000, 124, "ongoing", 60, 74]],
    },
  ],
};

export const MI_FORECASTING_V1: TemplateDef = {
  code: "mi-forecasting-v1",
  title: "Municipal Intelligence — Forecasting Data Template v1",
  pillar: "municipal-intel",
  subPillar: "forecasting",
  fileName: "WISE_Forecasting_Template_v1.xlsx",
  projectFields: [
    { key: "barangays", label: "Barangays (one per line)", kind: "list" },
  ],
  sheets: [
    {
      name: "TimeSeries",
      layout: "long",
      columns: [
        { key: "metric", header: "METRIC", type: "text", required: true, note: "e.g., population, water demand, IRA/NTA share, incident count" },
        { key: "barangay", header: "BARANGAY", type: "enum", required: false, enumSource: "barangays", note: "blank = municipal-wide" },
        { key: "year", header: "YEAR", type: "number", required: true, min: 1990, max: 2100 },
        { key: "value", header: "VALUE", type: "number", required: true },
        { key: "kind", header: "KIND", type: "enum", required: false, enumValues: ["historical", "projected"] },
      ],
      exampleRows: [["population", "", 2024, 45210, "historical"], ["population", "", 2030, 49820, "projected"]],
    },
    {
      name: "RiskRegister",
      layout: "long",
      columns: [
        { key: "risk", header: "RISK / HAZARD", type: "text", required: true },
        { key: "barangay", header: "BARANGAY", type: "enum", required: false, enumSource: "barangays" },
        { key: "likelihood", header: "LIKELIHOOD (1-5)", type: "number", required: true, min: 1, max: 5 },
        { key: "impact", header: "IMPACT (1-5)", type: "number", required: true, min: 1, max: 5 },
        { key: "exposed_population", header: "EXPOSED POPULATION", type: "number", required: false, min: 0 },
        { key: "mitigation", header: "MITIGATION MEASURE", type: "text", required: false },
      ],
      exampleRows: [["Flooding along river barangays", "Bagakay", 4, 3, 1200, "Drainage improvement + early warning"]],
    },
  ],
};

export const MI_REPORTING_V1: TemplateDef = {
  code: "mi-reporting-v1",
  title: "Municipal Intelligence — Cross-Agency Reporting Data Template v1",
  pillar: "municipal-intel",
  subPillar: "cross-agency-reporting",
  fileName: "WISE_CrossAgency_Template_v1.xlsx",
  projectFields: [
    { key: "fiscal_year", label: "Fiscal Year", kind: "number" },
  ],
  sheets: [
    {
      name: "Submissions",
      layout: "long",
      columns: [
        { key: "report_name", header: "REPORT", type: "text", required: true, note: "e.g., FDP Q1 posting, SGLG documents, GAD AR" },
        { key: "agency", header: "AGENCY", type: "enum", required: true, enumValues: ["DILG", "COA", "DBM", "NEDA", "DOH", "DepEd", "other"] },
        { key: "period_covered", header: "PERIOD COVERED", type: "text", required: false, note: "e.g., Q1 2026, CY 2025" },
        { key: "due_date", header: "DUE DATE", type: "date", required: true },
        { key: "submitted_date", header: "DATE SUBMITTED", type: "date", required: false },
        { key: "status", header: "STATUS", type: "enum", required: false, enumValues: ["not started", "in preparation", "submitted", "returned", "accepted"] },
        { key: "remarks", header: "REMARKS", type: "text", required: false },
      ],
      exampleRows: [["Full Disclosure Policy Q2 posting", "DILG", "Q2 2026", "2026-07-20", "", "in preparation", ""]],
    },
    {
      name: "PerformanceIndicators",
      layout: "long",
      columns: [
        { key: "indicator", header: "INDICATOR", type: "text", required: true, note: "e.g., SGLG core area result, LGPMS score" },
        { key: "period", header: "PERIOD", type: "text", required: true },
        { key: "target", header: "TARGET", type: "number", required: false },
        { key: "actual", header: "ACTUAL", type: "number", required: true },
        { key: "unit", header: "UNIT", type: "text", required: false },
      ],
      exampleRows: [["Local revenue growth", "CY 2025", 10, 12.4, "%"]],
    },
  ],
};
