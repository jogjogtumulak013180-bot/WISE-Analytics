import type { CapabilityGroup } from "./waterSystems";
import { WATER_SYSTEM_GROUPS } from "./waterSystems";
import { CONSTRUCTION_MANAGEMENT_GROUPS } from "./constructionManagement";
import { DEV_PLANNING_GROUPS } from "./devPlanning";
import { MUNICIPAL_INTEL_GROUPS } from "./municipalIntel";
import { EVENT_ORGANIZING_GROUPS } from "./eventOrganizing";

export interface PillarDef {
  slug: string;
  title: string;
  basePath: string;
  groups: CapabilityGroup[];
}

export const PILLARS: PillarDef[] = [
  {
    slug: "construction",
    title: "Construction Management",
    basePath: "/construction",
    groups: CONSTRUCTION_MANAGEMENT_GROUPS,
  },
  {
    slug: "dev-planning",
    title: "Development Planning",
    basePath: "/dev-planning",
    groups: DEV_PLANNING_GROUPS,
  },
  {
    slug: "municipal-intel",
    title: "Municipal Intelligence",
    basePath: "/municipal-intel",
    groups: MUNICIPAL_INTEL_GROUPS,
  },
  {
    slug: "water-systems",
    title: "Municipal Water Systems",
    basePath: "/water-systems",
    groups: WATER_SYSTEM_GROUPS,
  },
  {
    slug: "event-organizing",
    title: "Event Organizing",
    basePath: "/event-organizing",
    groups: EVENT_ORGANIZING_GROUPS,
  },
];

export function findPillar(slug: string): PillarDef | null {
  return PILLARS.find((p) => p.slug === slug) ?? null;
}
