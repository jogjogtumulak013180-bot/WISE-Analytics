import CapabilityHub from "../components/CapabilityHub";
import { MUNICIPAL_INTEL_GROUPS, MUNICIPAL_INTEL_TOTAL_COUNT } from "../lib/municipalIntel";

export default function MunicipalIntelHub() {
  return (
    <CapabilityHub
      eyebrow="MUNICIPAL INTELLIGENCE · DPMS"
      title="Municipal Intelligence"
      subtitle={`${MUNICIPAL_INTEL_TOTAL_COUNT} capability areas powering DPMS — needs analysis, intervention prioritization, forecasting, and cross-agency compliance reporting.`}
      groups={MUNICIPAL_INTEL_GROUPS}
      basePath="/municipal-intel"
    />
  );
}
