import type { TemplateDef } from "./types";

// water-fin-v1 — grounded in Waterworks_Operation_2025.xlsx (treatment/manpower/
// loan cost blocks + per-barangay collectible/collection rows).
// The promote RPC already maps this template to core_water_costs / core_water_billing.

export const WATER_FIN_V1: TemplateDef = {
  code: "water-fin-v1",
  title: "Water Utility Financial Operations — Data Template v1",
  pillar: "water-systems",
  subPillar: "utility-financial-operations",
  fileName: "WISE_WaterFinance_Template_v1.xlsx",
  projectFields: [
    { key: "reporting_year", label: "Reporting Year", kind: "number" },
    { key: "barangays", label: "Barangays Served (one per line)", kind: "list" },
    { key: "current_tariff", label: "Current Tariff (₱ per cu.m.)", kind: "number" },
  ],
  sheets: [
    {
      name: "Costs",
      layout: "long",
      columns: [
        { key: "period", header: "PERIOD (MONTH)", type: "date", required: true, note: "e.g., Jan or 2025-01" },
        {
          key: "cost_type", header: "COST TYPE", type: "enum", required: true,
          enumValues: ["treatment", "manpower", "loan"],
          note: "power cost is imported through the Operations Monitoring workbook",
        },
        { key: "ref", header: "REF (SOURCE / POSITION / ITEM)", type: "text", required: false, note: "e.g., Binaliw; Meter Reader; Interest" },
        { key: "amount", header: "AMOUNT (₱)", type: "number", required: true, min: 0 },
      ],
      exampleRows: [
        ["Jan", "treatment", "Binaliw", 15863.99],
        ["Jan", "manpower", "Meter Reader (7 pax)", 73500],
        ["Jan", "loan", "Interest", 333333.33],
      ],
    },
    {
      name: "Billing",
      layout: "long",
      columns: [
        { key: "period", header: "PERIOD (MONTH)", type: "date", required: true },
        { key: "barangay", header: "BARANGAY", type: "enum", required: true, enumSource: "barangays" },
        { key: "billed_amount", header: "BILLED / COLLECTIBLE (₱)", type: "number", required: false, min: 0 },
        { key: "collected_amount", header: "COLLECTED (₱)", type: "number", required: false, min: 0 },
      ],
      exampleRows: [["Jan", "Bagakay", 9500, 8235.8]],
    },
  ],
};

// water-ded-v1 — grounded in Hydraulic Design Criteria.xls (criteria sheet,
// demand-per-barangay, demand-per-node). Pairs with the EPANET .inp handled by
// the Interactive GIS Designer.

export const WATER_DED_V1: TemplateDef = {
  code: "water-ded-v1",
  title: "Water Detailed Engineering Design — Data Template v1",
  pillar: "water-systems",
  subPillar: "detailed-engineering-design",
  fileName: "WISE_WaterDED_Template_v1.xlsx",
  projectFields: [
    { key: "barangays", label: "Barangays Covered (one per line)", kind: "list" },
    { key: "design_period_years", label: "Design Period (years)", kind: "number" },
    { key: "lpcd", label: "Water Consumption (LCD)", kind: "number" },
  ],
  sheets: [
    {
      name: "DesignCriteria",
      layout: "long",
      columns: [
        { key: "param", header: "PARAMETER", type: "text", required: true, note: "e.g., Average Annual Growth Rate, MDD factor, Min Pressure Head" },
        { key: "value", header: "VALUE", type: "number", required: true },
        { key: "unit", header: "UNIT", type: "text", required: false, note: "e.g., LCD, m, m/s, ×ADD" },
        { key: "remarks", header: "REMARKS", type: "text", required: false },
      ],
      exampleRows: [
        ["Water Consumption", 80, "LCD", "residential demand"],
        ["Maximum Day Demand factor", 1.3, "×ADD", ""],
        ["Minimum Pressure Head", 24, "m", "distribution"],
      ],
    },
    {
      name: "DemandByBarangay",
      layout: "long",
      columns: [
        { key: "barangay", header: "BARANGAY", type: "enum", required: true, enumSource: "barangays" },
        { key: "households", header: "NO. OF HOUSEHOLDS", type: "number", required: true, min: 0 },
        { key: "household_size", header: "HOUSEHOLD SIZE", type: "number", required: true, min: 1 },
        { key: "projected_population", header: "PROJECTED POPULATION", type: "number", required: false, min: 0, note: "households × size if blank" },
        { key: "demand_lps", header: "DEMAND (LPS)", type: "number", required: false, min: 0 },
      ],
      exampleRows: [["Poblacion", 721, 6, 4326, 4.01]],
    },
    {
      name: "DemandPerNode",
      layout: "long",
      columns: [
        { key: "node_id", header: "NODE ID", type: "text", required: true, note: "must match junction IDs in the EPANET model" },
        { key: "barangay", header: "BARANGAY", type: "enum", required: false, enumSource: "barangays" },
        { key: "demand_lps", header: "DEMAND (LPS)", type: "number", required: true, min: 0 },
        { key: "remarks", header: "REMARKS", type: "text", required: false },
      ],
      exampleRows: [["J-12", "Poblacion", 1.29, "cluster of 186 HH"]],
    },
  ],
};
