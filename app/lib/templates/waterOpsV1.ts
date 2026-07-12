import type { TemplateDef } from "./types";

// water-ops-v1 — Municipal Water Systems / Operations Monitoring.
// One workbook populates all 10 Operations Monitoring item dashboards.
// Sheet shapes are grounded in Files/Municipal Water Supply System/
// Waterworks_Operation_2025.xlsx (wide month columns, per source / barangay).

export const WATER_OPS_V1: TemplateDef = {
  code: "water-ops-v1",
  title: "Water Operations Monitoring — Data Template v1",
  pillar: "water-systems",
  subPillar: "operations-monitoring",
  fileName: "WISE_WaterOps_Template_v1.xlsx",
  projectFields: [
    { key: "reporting_year", label: "Reporting Year", kind: "number" },
    { key: "sources", label: "Water Sources (one per line)", kind: "list" },
    { key: "barangays", label: "Barangays Served (one per line)", kind: "list" },
  ],
  sheets: [
    {
      name: "Production",
      layout: "wide-months",
      columns: [
        { key: "source", header: "SOURCE", type: "enum", required: true, enumSource: "sources" },
      ],
      valueKey: "volume_cum",
      valueMin: 0,
      exampleRows: [["Binaliw", 107606, 109758, 96357, "", "", "", "", "", "", "", "", ""]],
    },
    {
      name: "Consumption",
      layout: "wide-months",
      columns: [
        { key: "barangay", header: "BARANGAY", type: "enum", required: true, enumSource: "barangays" },
        { key: "source", header: "SOURCE", type: "enum", required: false, enumSource: "sources" },
      ],
      valueKey: "volume_cum",
      valueMin: 0,
      exampleRows: [["Bagakay", "Binaliw", 521, 1908, 1270, "", "", "", "", "", "", "", "", ""]],
    },
    {
      name: "PowerCost",
      layout: "wide-months",
      columns: [
        { key: "ref", header: "METER / STATION", type: "text", required: true },
      ],
      valueKey: "amount",
      valueMin: 0,
      exampleRows: [["Binaliw 0750215205", 615808.11, 625172, "", "", "", "", "", "", "", "", "", ""]],
    },
    {
      name: "PressureReadings",
      layout: "long",
      columns: [
        { key: "reading_date", header: "DATE", type: "date", required: true },
        { key: "location", header: "LOCATION / NODE", type: "text", required: true },
        { key: "pressure_psi", header: "PRESSURE (PSI)", type: "number", required: true, min: 0, max: 300 },
      ],
      exampleRows: [["2025-01-15", "Poblacion Junction 1", 45]],
    },
    {
      name: "LeakReports",
      layout: "long",
      columns: [
        { key: "report_date", header: "DATE REPORTED", type: "date", required: true },
        { key: "location", header: "LOCATION", type: "text", required: true },
        { key: "description", header: "DESCRIPTION", type: "text", required: false },
        { key: "repaired_date", header: "DATE REPAIRED", type: "date", required: false },
        {
          key: "status",
          header: "STATUS",
          type: "enum",
          required: false,
          enumValues: ["open", "repaired"],
        },
      ],
      exampleRows: [["2025-02-03", "Bagatayam mainline", "Joint leak, 50mm PVC", "2025-02-05", "repaired"]],
    },
    {
      name: "ReservoirLevels",
      layout: "long",
      columns: [
        { key: "reading_date", header: "DATE", type: "date", required: true },
        { key: "tank", header: "TANK / RESERVOIR", type: "text", required: true },
        { key: "level_m", header: "LEVEL (M)", type: "number", required: false, min: 0 },
        { key: "capacity_cum", header: "CAPACITY (CU.M.)", type: "number", required: false, min: 0 },
      ],
      exampleRows: [["2025-01-15", "Poblacion Tank", 3.2, 500]],
    },
  ],
};
