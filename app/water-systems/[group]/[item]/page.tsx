import { notFound } from "next/navigation";
import CapabilityDashboard from "../../../components/CapabilityDashboard";
import { findCapability } from "../../../lib/waterSystems";
import GisDesigner from "../../../components/GisDesigner";

export default function WaterSystemsDashboard({
  params,
}: {
  params: { group: string; item: string };
}) {
  const found = findCapability(params.group, params.item);
  if (!found) return notFound();
  const { group, item } = found;

  return (
    <CapabilityDashboard
      hubTitle="Municipal Water Systems"
      hubHref="/water-systems"
      group={group}
      item={item}
    >
      {item.slug === "interactive-gis-map" ? <GisDesigner /> : undefined}
    </CapabilityDashboard>
  );
}
