import { notFound } from "next/navigation";
import CapabilityDashboard from "../../../components/CapabilityDashboard";
import { findMunicipalIntelCapability } from "../../../lib/municipalIntel";

export default function MunicipalIntelDashboard({
  params,
}: {
  params: { group: string; item: string };
}) {
  const found = findMunicipalIntelCapability(params.group, params.item);
  if (!found) return notFound();
  const { group, item } = found;

  return (
    <CapabilityDashboard
      hubTitle="Municipal Intelligence"
      hubHref="/municipal-intel"
      group={group}
      item={item}
    />
  );
}
