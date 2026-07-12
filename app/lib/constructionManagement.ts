import type { CapabilityGroup } from "./waterSystems";

export const CONSTRUCTION_MANAGEMENT_GROUPS: CapabilityGroup[] = [
  {
    slug: "project-delivery",
    title: "1. Project Delivery",
    items: [
      { slug: "project-monitoring", title: "Project Monitoring" },
      { slug: "variation-orders", title: "Variation Orders" },
      { slug: "contract-management", title: "Contract Management" },
      { slug: "quality-control", title: "Quality Control" },
    ],
  },
  {
    slug: "schedule-cost-control",
    title: "2. Schedule & Cost Control",
    items: [
      { slug: "schedule-gantt-scurve", title: "Schedule / Gantt & S-Curve Tracker" },
      { slug: "cost-budget-monitoring", title: "Cost & Budget Monitoring" },
      { slug: "safety-monitoring", title: "Safety Monitoring" },
      { slug: "punch-list-deficiency-tracking", title: "Punch List / Deficiency Tracking" },
      { slug: "as-built-documentation", title: "As-Built Documentation" },
    ],
  },
];

export function findConstructionCapability(groupSlug: string, itemSlug: string) {
  const group = CONSTRUCTION_MANAGEMENT_GROUPS.find((g) => g.slug === groupSlug);
  if (!group) return null;
  const item = group.items.find((i) => i.slug === itemSlug);
  if (!item) return null;
  return { group, item };
}

export const CONSTRUCTION_MANAGEMENT_TOTAL_COUNT = CONSTRUCTION_MANAGEMENT_GROUPS.reduce(
  (sum, g) => sum + g.items.length,
  0
);
