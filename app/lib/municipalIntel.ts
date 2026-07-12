import type { CapabilityGroup } from "./waterSystems";

export const MUNICIPAL_INTEL_GROUPS: CapabilityGroup[] = [
  {
    slug: "needs-analysis",
    title: "1. Needs Analysis",
    items: [
      { slug: "household-needs-analysis", title: "Household Needs Analysis" },
      { slug: "barangay-prioritization", title: "Barangay Prioritization" },
      { slug: "infrastructure-analysis", title: "Infrastructure Analysis" },
      { slug: "spatial-heatmaps", title: "Spatial Heatmaps" },
      { slug: "gis-intelligence", title: "GIS Intelligence" },
    ],
  },
  {
    slug: "intervention",
    title: "2. Intervention",
    items: [
      { slug: "investment-prioritization", title: "Investment Prioritization" },
      { slug: "intervention-analysis", title: "Intervention Analysis" },
      { slug: "monitoring-evaluation", title: "Monitoring & Evaluation" },
      { slug: "executive-reports", title: "Executive Reports" },
    ],
  },
  {
    slug: "forecasting",
    title: "3. Forecasting",
    items: [
      { slug: "ai-insights", title: "AI Insights" },
      { slug: "scenario-analysis", title: "Scenario Analysis" },
      { slug: "risk-assessment", title: "Risk Assessment" },
      { slug: "predictive-analytics", title: "Predictive Analytics" },
    ],
  },
  {
    slug: "cross-agency-reporting",
    title: "4. Cross-Agency Reporting",
    items: [
      { slug: "dilg-reports", title: "DILG Reports" },
      { slug: "coa-reports", title: "COA Reports" },
      { slug: "annual-reports", title: "Annual Reports" },
      { slug: "performance-reports", title: "Performance Reports" },
      { slug: "custom-reports", title: "Custom Reports" },
    ],
  },
];

export function findMunicipalIntelCapability(groupSlug: string, itemSlug: string) {
  const group = MUNICIPAL_INTEL_GROUPS.find((g) => g.slug === groupSlug);
  if (!group) return null;
  const item = group.items.find((i) => i.slug === itemSlug);
  if (!item) return null;
  return { group, item };
}

export const MUNICIPAL_INTEL_TOTAL_COUNT = MUNICIPAL_INTEL_GROUPS.reduce(
  (sum, g) => sum + g.items.length,
  0
);
