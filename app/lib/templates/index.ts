import type { TemplateDef } from "./types";
import { WATER_OPS_V1 } from "./waterOpsV1";
import { WATER_FIN_V1, WATER_DED_V1 } from "./waterFinDedV1";
import { CONSTRUCTION_DELIVERY_V1, CONSTRUCTION_SCHEDULE_V1 } from "./constructionV1";
import {
  DP_WSSMP_V1,
  DP_THEMATIC_V1,
  DP_PROGRAMMING_V1,
  DP_PREFS_V1,
  DP_FS_V1,
} from "./devPlanningV1";
import {
  MI_NEEDS_V1,
  MI_INTERVENTION_V1,
  MI_FORECASTING_V1,
  MI_REPORTING_V1,
} from "./municipalIntelV1";
import { EVENT_DESIGN_V1, EVENT_TRACKS_V1, EVENT_EVAL_V1 } from "./eventOrganizingV1";

const ALL: TemplateDef[] = [
  // Construction Management
  CONSTRUCTION_DELIVERY_V1,
  CONSTRUCTION_SCHEDULE_V1,
  // Development Planning
  DP_WSSMP_V1,
  DP_THEMATIC_V1,
  DP_PROGRAMMING_V1,
  DP_PREFS_V1,
  DP_FS_V1,
  // Municipal Intelligence
  MI_NEEDS_V1,
  MI_INTERVENTION_V1,
  MI_FORECASTING_V1,
  MI_REPORTING_V1,
  // Municipal Water Systems
  WATER_DED_V1,
  WATER_OPS_V1,
  WATER_FIN_V1,
  // Event Organizing
  EVENT_DESIGN_V1,
  EVENT_TRACKS_V1,
  EVENT_EVAL_V1,
];

export const TEMPLATES: Record<string, TemplateDef> = Object.fromEntries(
  ALL.map((t) => [t.code, t])
);

/** sub-pillar slug → template. water-systems/operations-report has no import
 *  (it is a generated output of the two water datasets). */
export function templateForSubPillar(pillar: string, subPillar: string): TemplateDef | null {
  return ALL.find((t) => t.pillar === pillar && t.subPillar === subPillar) ?? null;
}

/** all templates for a pillar (e.g. Construction has two: Delivery + Schedule/Cost
 *  Control, both importable against the same project). */
export function templatesForPillar(pillar: string): TemplateDef[] {
  return ALL.filter((t) => t.pillar === pillar);
}
