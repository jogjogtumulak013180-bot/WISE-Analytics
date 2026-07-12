import type { CapabilityGroup } from "./waterSystems";

export const DEV_PLANNING_GROUPS: CapabilityGroup[] = [
  {
    slug: "water-supply-sanitation-master-plan",
    title: "1. Water Supply & Sanitation Master Plan",
    items: [
      { slug: "water-supply-master-plan", title: "Water Supply Master Plan" },
      { slug: "demand-forecasting", title: "Demand Forecasting" },
      { slug: "population-projection", title: "Population Projection" },
      { slug: "capital-improvement-plan", title: "Capital Improvement Plan" },
      { slug: "project-prioritization", title: "Project Prioritization" },
      { slug: "climate-drought-assessment", title: "Climate & Drought Assessment" },
    ],
  },
  {
    slug: "thematic-sectoral-plans",
    title: "2. Thematic & Sectoral Plans",
    items: [
      { slug: "cdp", title: "Comprehensive Development Plan (CDP)" },
      { slug: "clup", title: "Comprehensive Land Use Plan (CLUP)" },
      { slug: "lccap", title: "Local Climate Change Action Plan (LCCAP)" },
      { slug: "local-shelter-plan", title: "Local Shelter Plan (LSP)" },
      { slug: "solid-waste-management-plan", title: "Solid Waste Management Plan" },
      { slug: "gad-plan", title: "Gender and Development (GAD) Plan" },
      { slug: "drrm-plan", title: "Disaster Risk Reduction & Management Plan" },
      { slug: "tourism-development-plan", title: "Tourism Development Plan" },
    ],
  },
  {
    slug: "programming-investment",
    title: "3. Programming & Investment",
    items: [
      { slug: "ela", title: "Executive-Legislative Agenda (ELA)" },
      { slug: "aip", title: "Annual Investment Program (AIP)" },
      { slug: "ldip", title: "Local Development Investment Program (LDIP)" },
      { slug: "ppa-matrix-builder", title: "PPA Matrix Builder" },
    ],
  },
  {
    slug: "pre-feasibility-study",
    title: "4. Pre-Feasibility Study",
    items: [
      { slug: "source-assessment", title: "Source Assessment" },
      { slug: "bulk-hydraulic-analysis", title: "Bulk Hydraulic Analysis" },
    ],
  },
  {
    slug: "feasibility-study",
    title: "5. Feasibility Study",
    items: [
      { slug: "financial-model", title: "Financial Model" },
      { slug: "break-even-analysis", title: "Break-even Analysis" },
      { slug: "sensitivity-analysis", title: "Sensitivity Analysis" },
      { slug: "investment-analysis", title: "Investment Analysis" },
    ],
  },
];

export function findDevPlanningCapability(groupSlug: string, itemSlug: string) {
  const group = DEV_PLANNING_GROUPS.find((g) => g.slug === groupSlug);
  if (!group) return null;
  const item = group.items.find((i) => i.slug === itemSlug);
  if (!item) return null;
  return { group, item };
}

export const DEV_PLANNING_TOTAL_COUNT = DEV_PLANNING_GROUPS.reduce(
  (sum, g) => sum + g.items.length,
  0
);
