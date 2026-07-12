import { Suspense } from "react";
import { notFound } from "next/navigation";
import CapabilityDashboard from "../../../components/CapabilityDashboard";
import { findCapability } from "../../../lib/waterSystems";
import GisDesigner from "../../../components/GisDesigner";
import AnalyticsPanel from "../../../components/AnalyticsPanel";

export default function WaterSystemsDashboard({
  params,
}: {
  params: { group: string; item: string };
}) {
  const found = findCapability(params.group, params.item);
  if (!found) return notFound();
  const { group, item } = found;

  let content: React.ReactNode = undefined;
  if (item.slug === "interactive-gis-map") {
    content = <GisDesigner />;
  } else if (group.slug === "operations-monitoring") {
    content = (
      <Suspense>
        <AnalyticsPanel
          pillar="water-systems"
          group={group.slug}
          item={item.slug}
        />
      </Suspense>
    );
  }

  return (
    <CapabilityDashboard
      hubTitle="Municipal Water Systems"
      hubHref="/water-systems"
      group={group}
      item={item}
    >
      {content}
    </CapabilityDashboard>
  );
}
