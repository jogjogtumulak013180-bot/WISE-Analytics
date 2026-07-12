import type { TemplateDef } from "./types";
import { WATER_OPS_V1 } from "./waterOpsV1";

export const TEMPLATES: Record<string, TemplateDef> = {
  [WATER_OPS_V1.code]: WATER_OPS_V1,
};

/** sub-pillar slug → template (pilot: water operations monitoring) */
export function templateForSubPillar(pillar: string, subPillar: string): TemplateDef | null {
  return (
    Object.values(TEMPLATES).find(
      (t) => t.pillar === pillar && t.subPillar === subPillar
    ) ?? null
  );
}
