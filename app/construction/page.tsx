import CapabilityHub from "../components/CapabilityHub";
import {
  CONSTRUCTION_MANAGEMENT_GROUPS,
  CONSTRUCTION_MANAGEMENT_TOTAL_COUNT,
} from "../lib/constructionManagement";

export default function ConstructionHub() {
  return (
    <CapabilityHub
      eyebrow="CONSTRUCTION MANAGEMENT · INTERNAL TOOL"
      title="Construction Management"
      subtitle={`${CONSTRUCTION_MANAGEMENT_TOTAL_COUNT} capability areas covering project delivery through schedule and cost control — monitoring, contractor management, quality, safety, and documentation for active builds.`}
      groups={CONSTRUCTION_MANAGEMENT_GROUPS}
      basePath="/construction"
    />
  );
}
