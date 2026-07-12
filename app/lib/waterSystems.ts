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
      {
        slug: "interactive-gis-map",
        title: "Interactive GIS Map (Hydraulic Simulation, BOQ & Cost Estimate)",
      },
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
    slug: "utility-financial-operations",
    title: "3. Utility Financial Operations",
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
    slug: "operations-report",
    title: "4. Operations Report",
    items: [
      { slug: "water-operations-report", title: "Water Operations Report" },
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
