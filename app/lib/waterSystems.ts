export interface CapabilityItem {
  slug: string;
  title: string;
}

export interface CapabilityGroup {
  slug: string;
  title: string;
  items: CapabilityItem[];
}

export const WATER_SYSTEM_GROUPS: CapabilityGroup[] = [
  {
    slug: "planning-feasibility",
    title: "1. Planning & Feasibility",
    items: [
      { slug: "water-supply-master-plan", title: "Water Supply Master Plan" },
      { slug: "demand-forecasting", title: "Demand Forecasting" },
      { slug: "population-projection", title: "Population Projection" },
      { slug: "source-assessment", title: "Source Assessment" },
      { slug: "water-balance", title: "Water Balance" },
      { slug: "capital-improvement-plan", title: "Capital Improvement Plan" },
      { slug: "climate-drought-assessment", title: "Climate & Drought Assessment" },
      { slug: "project-prioritization", title: "Project Prioritization" },
    ],
  },
  {
    slug: "engineering-design",
    title: "2. Engineering & Design",
    items: [
      { slug: "interactive-gis-designer", title: "Interactive GIS Designer" },
      { slug: "epanet-designer", title: "EPANET Designer" },
      { slug: "hydraulic-simulation", title: "Hydraulic Simulation" },
      { slug: "reservoir-design", title: "Reservoir Design" },
      { slug: "pump-design", title: "Pump Design" },
      { slug: "transmission-line-design", title: "Transmission Line Design" },
      { slug: "distribution-network-design", title: "Distribution Network Design" },
      { slug: "pipe-sizing", title: "Pipe Sizing" },
      { slug: "fire-flow-analysis", title: "Fire Flow Analysis" },
      { slug: "boq-generator", title: "BOQ Generator" },
      { slug: "cost-estimator", title: "Cost Estimator" },
    ],
  },
  {
    slug: "construction-management",
    title: "3. Construction Management",
    items: [
      { slug: "project-monitoring", title: "Project Monitoring" },
      { slug: "progress-tracking", title: "Progress Tracking" },
      { slug: "variation-orders", title: "Variation Orders" },
      { slug: "contractor-management", title: "Contractor Management" },
      { slug: "quality-control", title: "Quality Control" },
      { slug: "photo-documentation", title: "Photo Documentation" },
      { slug: "turnover", title: "Turnover" },
    ],
  },
  {
    slug: "operations-monitoring",
    title: "4. Operations Monitoring",
    items: [
      { slug: "production-monitoring", title: "Production Monitoring" },
      { slug: "consumption-monitoring", title: "Consumption Monitoring" },
      { slug: "nrw-dashboard", title: "NRW Dashboard" },
      { slug: "pressure-monitoring", title: "Pressure Monitoring" },
      { slug: "pump-operations", title: "Pump Operations" },
      { slug: "reservoir-monitoring", title: "Reservoir Monitoring" },
      { slug: "water-source-monitoring", title: "Water Source Monitoring" },
      { slug: "leak-monitoring", title: "Leak Monitoring" },
      { slug: "energy-monitoring", title: "Energy Monitoring" },
      { slug: "operations-dashboard", title: "Operations Dashboard" },
    ],
  },
  {
    slug: "financial-management",
    title: "5. Financial Management",
    items: [
      { slug: "financial-model", title: "Financial Model" },
      { slug: "revenue-analysis", title: "Revenue Analysis" },
      { slug: "operating-expenses", title: "Operating Expenses" },
      { slug: "collection-efficiency", title: "Collection Efficiency" },
      { slug: "cash-flow", title: "Cash Flow" },
      { slug: "tariff-analysis", title: "Tariff Analysis" },
      { slug: "break-even-analysis", title: "Break-even Analysis" },
      { slug: "sensitivity-analysis", title: "Sensitivity Analysis" },
      { slug: "financial-dashboard", title: "Financial Dashboard" },
      { slug: "investment-analysis", title: "Investment Analysis" },
    ],
  },
  {
    slug: "asset-management",
    title: "6. Asset Management",
    items: [
      { slug: "asset-registry", title: "Asset Registry" },
      { slug: "gis-asset-inventory", title: "GIS Asset Inventory" },
      { slug: "preventive-maintenance", title: "Preventive Maintenance" },
      { slug: "corrective-maintenance", title: "Corrective Maintenance" },
      { slug: "work-orders", title: "Work Orders" },
      { slug: "asset-condition", title: "Asset Condition" },
      { slug: "lifecycle-analysis", title: "Lifecycle Analysis" },
      { slug: "replacement-planning", title: "Replacement Planning" },
    ],
  },
  {
    slug: "customer-services",
    title: "7. Customer Services",
    items: [
      { slug: "service-connections", title: "Service Connections" },
      { slug: "meter-management", title: "Meter Management" },
      { slug: "customer-complaints", title: "Customer Complaints" },
      { slug: "service-requests", title: "Service Requests" },
      { slug: "billing-integration", title: "Billing Integration" },
      { slug: "customer-analytics", title: "Customer Analytics" },
    ],
  },
  {
    slug: "executive-intelligence",
    title: "8. Executive Intelligence",
    items: [
      { slug: "kpi-dashboard", title: "KPI Dashboard" },
      { slug: "gis-intelligence", title: "GIS Intelligence" },
      { slug: "ai-insights", title: "AI Insights" },
      { slug: "scenario-analysis", title: "Scenario Analysis" },
      { slug: "investment-prioritization", title: "Investment Prioritization" },
      { slug: "risk-assessment", title: "Risk Assessment" },
      { slug: "climate-resilience", title: "Climate Resilience" },
      { slug: "executive-reports", title: "Executive Reports" },
    ],
  },
  {
    slug: "reports-compliance",
    title: "9. Reports & Compliance",
    items: [
      { slug: "lwua-reports", title: "LWUA Reports" },
      { slug: "dilg-reports", title: "DILG Reports" },
      { slug: "coa-reports", title: "COA Reports" },
      { slug: "doh-water-safety", title: "DOH Water Safety" },
      { slug: "annual-reports", title: "Annual Reports" },
      { slug: "performance-reports", title: "Performance Reports" },
      { slug: "custom-reports", title: "Custom Reports" },
    ],
  },
];

export function findCapability(groupSlug: string, itemSlug: string) {
  const group = WATER_SYSTEM_GROUPS.find((g) => g.slug === groupSlug);
  if (!group) return null;
  const item = group.items.find((i) => i.slug === itemSlug);
  if (!item) return null;
  return { group, item };
}

export const TOTAL_CAPABILITY_COUNT = WATER_SYSTEM_GROUPS.reduce(
  (sum, g) => sum + g.items.length,
  0
);
