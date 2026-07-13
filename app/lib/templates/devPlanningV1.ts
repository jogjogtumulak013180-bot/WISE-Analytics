import type { TemplateDef } from "./types";
import { num } from "./types";

// FS / Pre-FS sheets are grounded in Files/Municipal Water Supply System/
// Water_System_Feasibility_Study.xls (MKT/TCH/FIN exhibits, 20-year columns →
// long format: one row per line item per project year).
// Programming & Investment follows the standard DILG/DBM AIP-LDIP form columns.

export const DP_WSSMP_V1: TemplateDef = {
  code: "dp-wssmp-v1",
  title: "Water Supply & Sanitation Master Plan — Data Template v1",
  pillar: "dev-planning",
  subPillar: "water-supply-sanitation-master-plan",
  fileName: "WISE_WSSMP_Template_v1.xlsx",
  projectFields: [
    { key: "barangays", label: "Barangays (one per line)", kind: "list" },
    { key: "base_year", label: "Base Year", kind: "number" },
    { key: "planning_horizon_years", label: "Planning Horizon (years)", kind: "number" },
  ],
  sheets: [
    {
      name: "PopulationProjection",
      layout: "long",
      columns: [
        { key: "barangay", header: "BARANGAY", type: "enum", required: true, enumSource: "barangays" },
        { key: "year", header: "YEAR", type: "number", required: true, min: 1990, max: 2100 },
        { key: "population", header: "POPULATION", type: "number", required: true, min: 0 },
        { key: "households", header: "HOUSEHOLDS", type: "number", required: false, min: 0 },
        { key: "growth_rate", header: "GROWTH RATE", type: "number", required: false, note: "decimal, e.g., 0.0268 — % accepted" },
      ],
      exampleRows: [["Poblacion", 2025, 5813, 969, "2.68%"]],
    },
    {
      name: "DemandForecast",
      layout: "long",
      columns: [
        { key: "year", header: "YEAR", type: "number", required: true, min: 1990, max: 2100 },
        { key: "category", header: "CATEGORY", type: "enum", required: true, enumValues: ["residential", "commercial", "institutional", "industrial"] },
        { key: "served_connections", header: "SERVED CONNECTIONS", type: "number", required: false, min: 0 },
        { key: "demand_cmd", header: "DEMAND (CU.M./DAY)", type: "number", required: true, min: 0 },
        { key: "ufw_pct", header: "UFW %", type: "number", required: false, min: 0, max: 100, note: "unaccounted-for water allowance" },
      ],
      exampleRows: [[2025, "residential", 1385, 665, 20]],
    },
    {
      name: "CapitalImprovementPlan",
      layout: "long",
      columns: [
        { key: "project_name", header: "PROJECT / COMPONENT", type: "text", required: true },
        { key: "phase", header: "PHASE", type: "enum", required: false, enumValues: ["immediate", "short-term", "medium-term", "long-term"] },
        { key: "start_year", header: "START YEAR", type: "number", required: true, min: 1990, max: 2100 },
        { key: "cost", header: "ESTIMATED COST (₱)", type: "number", required: true, min: 0 },
        { key: "funding_source", header: "FUNDING SOURCE", type: "text", required: false },
        { key: "priority_score", header: "PRIORITY SCORE", type: "number", required: false, min: 0, max: 100 },
      ],
      exampleRows: [["Transmission line upgrade, Binaliw", "short-term", 2026, 12500000, "LGU + LWUA loan", 85]],
    },
  ],
};

export const DP_THEMATIC_V1: TemplateDef = {
  code: "dp-thematic-v1",
  title: "Thematic & Sectoral Plans — PPA Data Template v1",
  pillar: "dev-planning",
  subPillar: "thematic-sectoral-plans",
  fileName: "WISE_ThematicPlans_Template_v1.xlsx",
  projectFields: [
    { key: "plan_type", label: "Plan Type (CDP, CLUP, LCCAP, LSP, SWMP, GAD, DRRM, TDP)", kind: "text" },
    { key: "plan_period", label: "Plan Period (e.g., 2026-2031)", kind: "text" },
  ],
  sheets: [
    {
      name: "SectorProfile",
      layout: "long",
      columns: [
        { key: "sector", header: "SECTOR", type: "enum", required: true, enumValues: ["social", "economic", "environmental", "infrastructure", "institutional"] },
        { key: "indicator", header: "INDICATOR", type: "text", required: true },
        { key: "value", header: "VALUE", type: "number", required: true },
        { key: "unit", header: "UNIT", type: "text", required: false },
        { key: "year", header: "YEAR", type: "number", required: false, min: 1990, max: 2100 },
        { key: "source", header: "DATA SOURCE", type: "text", required: false, note: "e.g., CBMS 2024, PSA Census" },
      ],
      exampleRows: [["social", "Households without access to safe water", 1811, "HH", 2024, "CBMS 2024"]],
    },
    {
      name: "PPAMatrix",
      layout: "long",
      columns: [
        { key: "ppa", header: "PROGRAM / PROJECT / ACTIVITY", type: "text", required: true },
        { key: "sector", header: "SECTOR", type: "enum", required: false, enumValues: ["social", "economic", "environmental", "infrastructure", "institutional"] },
        { key: "objective", header: "OBJECTIVE / EXPECTED OUTPUT", type: "text", required: false },
        { key: "implementing_office", header: "IMPLEMENTING OFFICE", type: "text", required: false },
        { key: "start_year", header: "START YEAR", type: "number", required: true, min: 1990, max: 2100 },
        { key: "end_year", header: "END YEAR", type: "number", required: false, min: 1990, max: 2100 },
        { key: "cost", header: "ESTIMATED COST (₱)", type: "number", required: true, min: 0 },
        { key: "funding_source", header: "FUNDING SOURCE", type: "text", required: false },
      ],
      exampleRows: [["Construction of Level III water system, Brgy. Bagakay", "infrastructure", "24/7 potable water for 320 HH", "MEO / Waterworks", 2026, 2027, 18500000, "20% DF"]],
    },
  ],
};

export const DP_PROGRAMMING_V1: TemplateDef = {
  code: "dp-programming-v1",
  title: "Programming & Investment (ELA / AIP / LDIP) — Data Template v1",
  pillar: "dev-planning",
  subPillar: "programming-investment",
  fileName: "WISE_Programming_Template_v1.xlsx",
  projectFields: [
    { key: "fiscal_year", label: "Fiscal Year", kind: "number" },
    { key: "total_budget", label: "Total Investable Budget (₱)", kind: "number" },
  ],
  sheets: [
    {
      name: "AIP",
      layout: "long",
      columns: [
        { key: "aip_code", header: "AIP REF CODE", type: "text", required: true, note: "e.g., 1000-01-001" },
        { key: "ppa", header: "PROGRAM / PROJECT / ACTIVITY", type: "text", required: true },
        { key: "implementing_office", header: "IMPLEMENTING OFFICE", type: "text", required: true },
        { key: "start_date", header: "START", type: "date", required: false },
        { key: "end_date", header: "COMPLETION", type: "date", required: false },
        { key: "expected_output", header: "EXPECTED OUTPUT", type: "text", required: false },
        { key: "funding_source", header: "FUNDING SOURCE", type: "text", required: false, note: "GF, 20% DF, SEF, trust fund, grant…" },
        { key: "ps", header: "PS (₱)", type: "number", required: false, min: 0, note: "personal services" },
        { key: "mooe", header: "MOOE (₱)", type: "number", required: false, min: 0 },
        { key: "co", header: "CO (₱)", type: "number", required: false, min: 0, note: "capital outlay" },
        {
          key: "total", header: "TOTAL (₱)", type: "number", required: false, min: 0,
          derive: (r) => {
            const ps = num(r, "ps") ?? 0; const mooe = num(r, "mooe") ?? 0; const co = num(r, "co") ?? 0;
            const any = num(r, "ps") !== null || num(r, "mooe") !== null || num(r, "co") !== null;
            return any ? ps + mooe + co : null;
          },
          note: "PS + MOOE + CO; auto-recomputed if broken",
        },
        { key: "cc_typology", header: "CC TYPOLOGY", type: "text", required: false, note: "climate change adaptation/mitigation code" },
      ],
      exampleRows: [["8000-03-002", "Rehabilitation of municipal waterworks", "MEO", "2026-01", "2026-12", "NRW reduced to 25%", "20% DF", 0, 500000, 4500000, 5000000, "A2"]],
    },
  ],
};

export const DP_PREFS_V1: TemplateDef = {
  code: "dp-prefs-v1",
  title: "Pre-Feasibility Study — Data Template v1",
  pillar: "dev-planning",
  subPillar: "pre-feasibility-study",
  fileName: "WISE_PreFS_Template_v1.xlsx",
  projectFields: [
    { key: "barangays", label: "Target Barangays (one per line)", kind: "list" },
  ],
  sheets: [
    {
      name: "SourceAssessment",
      layout: "long",
      columns: [
        { key: "source_name", header: "SOURCE NAME", type: "text", required: true },
        { key: "source_type", header: "TYPE", type: "enum", required: true, enumValues: ["spring", "deep well", "river", "surface", "existing system"] },
        { key: "yield_lps", header: "YIELD (LPS)", type: "number", required: true, min: 0 },
        { key: "elevation_m", header: "ELEVATION (M)", type: "number", required: false },
        { key: "distance_km", header: "DISTANCE TO DEMAND (KM)", type: "number", required: false, min: 0 },
        { key: "water_quality", header: "WATER QUALITY NOTES", type: "text", required: false },
      ],
      exampleRows: [["Binaliw Spring", "spring", 25, 180, 3.2, "passes PNSDW; chlorination only"]],
    },
    {
      name: "BulkHydraulics",
      layout: "long",
      columns: [
        { key: "segment", header: "SEGMENT", type: "text", required: true, note: "e.g., Source–Reservoir, Reservoir–Poblacion" },
        { key: "flow_lps", header: "DESIGN FLOW (LPS)", type: "number", required: true, min: 0 },
        { key: "length_m", header: "LENGTH (M)", type: "number", required: true, min: 0 },
        { key: "diameter_mm", header: "PIPE DIA (MM)", type: "number", required: false, min: 0 },
        { key: "headloss_m", header: "HEADLOSS (M)", type: "number", required: false, min: 0 },
        { key: "static_head_m", header: "STATIC HEAD (M)", type: "number", required: false },
      ],
      exampleRows: [["Source–Reservoir", 25, 3200, 200, 18.4, 65]],
    },
  ],
};

export const DP_FS_V1: TemplateDef = {
  code: "dp-fs-v1",
  title: "Feasibility Study Financial Model — Data Template v1",
  pillar: "dev-planning",
  subPillar: "feasibility-study",
  fileName: "WISE_FS_Template_v1.xlsx",
  projectFields: [
    { key: "project_years", label: "Projection Period (years, e.g., 20)", kind: "number" },
    { key: "discount_rate", label: "Discount Rate (decimal, e.g., 0.10)", kind: "number" },
  ],
  sheets: [
    {
      name: "Assumptions",
      layout: "long",
      columns: [
        { key: "param", header: "PARAMETER", type: "text", required: true, note: "e.g., HH size, lpcd, market share Y1, UFW, connection fee" },
        { key: "value", header: "VALUE", type: "number", required: true },
        { key: "unit", header: "UNIT", type: "text", required: false },
      ],
      exampleRows: [["Ave. household size", 4.81, "members"], ["Target market share Y1", "35%", ""]],
    },
    {
      name: "CapitalCost",
      layout: "long",
      columns: [
        { key: "component", header: "COMPONENT", type: "text", required: true, note: "e.g., site works, building, M&E, pipelines" },
        { key: "cost", header: "COST (₱)", type: "number", required: true, min: 0 },
        { key: "year", header: "YEAR INCURRED", type: "number", required: false, min: 0, max: 50, note: "project year (0 = pre-operating)" },
        { key: "depreciable_life_years", header: "DEPRECIABLE LIFE (YEARS)", type: "number", required: false, min: 1 },
      ],
      exampleRows: [["Transmission & distribution pipelines", 25300000, 0, 40]],
    },
    {
      name: "Projections",
      layout: "long",
      columns: [
        {
          key: "line_item", header: "LINE ITEM", type: "enum", required: true,
          enumValues: ["sales volume (cu.m.)", "revenue", "operating cost", "debt service", "connections"],
        },
        { key: "year", header: "PROJECT YEAR", type: "number", required: true, min: 1, max: 50 },
        { key: "value", header: "VALUE", type: "number", required: true },
      ],
      exampleRows: [["sales volume (cu.m.)", 1, 138437], ["operating cost", 1, 1528683], ["debt service", 1, 2340000]],
    },
    {
      name: "Financing",
      layout: "long",
      columns: [
        { key: "item", header: "ITEM", type: "enum", required: true, enumValues: ["loan principal", "interest rate", "grace period (years)", "repayment period (years)", "equity", "grant"] },
        { key: "value", header: "VALUE", type: "number", required: true, min: 0, note: "rate as decimal or %" },
      ],
      exampleRows: [["loan principal", 26000000], ["interest rate", "9%"]],
    },
  ],
};
