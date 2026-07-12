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
    slug: "detailed-engineering-design",
    title: "1. Detailed Engineering Design",
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
    slug: "operations-monitoring",
    title: "2. Operations Monitoring",
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
    slug: "asset-management",
    title: "3. Asset Management",
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
    title: "4. Customer Services",
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
    slug: "utility-financial-operations",
    title: "5. Utility Financial Operations",
    items: [
      { slug: "revenue-analysis", title: "Revenue Analysis" },
      { slug: "operating-expenses", title: "Operating Expenses" },
      { slug: "collection-efficiency", title: "Collection Efficiency" },
      { slug: "cash-flow", title: "Cash Flow" },
      { slug: "tariff-analysis", title: "Tariff Analysis" },
      { slug: "financial-dashboard", title: "Financial Dashboard" },
    ],
  },
  {
    slug: "water-regulatory-reports",
    title: "6. Water Regulatory Reports",
    items: [
      { slug: "lwua-reports", title: "LWUA Reports" },
      { slug: "doh-water-safety", title: "DOH Water Safety" },
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
