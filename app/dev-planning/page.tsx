import CapabilityHub from "../components/CapabilityHub";
import { DEV_PLANNING_GROUPS, DEV_PLANNING_TOTAL_COUNT } from "../lib/devPlanning";

export default function DevPlanningHub() {
  return (
    <CapabilityHub
      eyebrow="LOCAL DEVELOPMENT PLANNING · INTERNAL TOOL"
      title="Local Development Planning"
      subtitle={`${DEV_PLANNING_TOTAL_COUNT} capability areas covering the Water Supply & Sanitation Master Plan, thematic and sectoral plans (CDP, CLUP, LCCAP, and more), investment programming, baseline profiling, and feasibility studies.`}
      groups={DEV_PLANNING_GROUPS}
      basePath="/dev-planning"
    />
  );
}
