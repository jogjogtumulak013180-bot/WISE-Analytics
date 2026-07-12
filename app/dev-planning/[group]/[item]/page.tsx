import { notFound } from "next/navigation";
import CapabilityDashboard from "../../../components/CapabilityDashboard";
import { findDevPlanningCapability } from "../../../lib/devPlanning";

export default function DevPlanningDashboard({
  params,
}: {
  params: { group: string; item: string };
}) {
  const found = findDevPlanningCapability(params.group, params.item);
  if (!found) return notFound();
  const { group, item } = found;

  return (
    <CapabilityDashboard
      hubTitle="Local Development Planning"
      hubHref="/dev-planning"
      group={group}
      item={item}
    />
  );
}
