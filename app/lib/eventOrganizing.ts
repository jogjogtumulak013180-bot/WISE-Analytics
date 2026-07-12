import type { CapabilityGroup } from "./waterSystems";

export const EVENT_ORGANIZING_GROUPS: CapabilityGroup[] = [
  {
    slug: "training-design-delivery",
    title: "1. Training Design & Delivery",
    items: [
      { slug: "curriculum-module-development", title: "Curriculum & Module Development" },
      { slug: "training-calendar-scheduling", title: "Training Calendar & Scheduling" },
      { slug: "participant-registration-certificates", title: "Participant Registration & Certificates" },
    ],
  },
  {
    slug: "core-capability-training-tracks",
    title: "2. Core Capability Training Tracks",
    items: [
      { slug: "municipal-intelligence-training", title: "Municipal Intelligence (DPMS) Training" },
      { slug: "development-planning-training", title: "Development Planning Training" },
      { slug: "construction-management-training", title: "Construction Management Training" },
      { slug: "water-systems-training", title: "Water Systems Training" },
    ],
  },
  {
    slug: "training-evaluation-report",
    title: "3. Training Evaluation & Report",
    items: [
      { slug: "training-evaluation-completion-report", title: "Training Evaluation & Completion Report" },
    ],
  },
];

export function findEventOrganizingCapability(groupSlug: string, itemSlug: string) {
  const group = EVENT_ORGANIZING_GROUPS.find((g) => g.slug === groupSlug);
  if (!group) return null;
  const item = group.items.find((i) => i.slug === itemSlug);
  if (!item) return null;
  return { group, item };
}

export const EVENT_ORGANIZING_TOTAL_COUNT = EVENT_ORGANIZING_GROUPS.reduce(
  (sum, g) => sum + g.items.length,
  0
);
