import CapabilityHub from "../components/CapabilityHub";
import { WATER_SYSTEM_GROUPS, TOTAL_CAPABILITY_COUNT } from "../lib/waterSystems";

export default function WaterSystemsHub() {
  return (
    <CapabilityHub
      eyebrow="MUNICIPAL WATER SYSTEMS · INTERNAL TOOL"
      title="Municipal Water Systems"
      subtitle={`${TOTAL_CAPABILITY_COUNT} capability areas covering detailed engineering design and full utility operations — from network design and hydraulic simulation through monitoring, assets, customer service, financial operations, and regulatory reporting.`}
      groups={WATER_SYSTEM_GROUPS}
      basePath="/water-systems"
    />
  );
}
