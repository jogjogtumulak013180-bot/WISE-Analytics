import { notFound } from "next/navigation";
import CapabilityDashboard from "../../../components/CapabilityDashboard";
import { findEventOrganizingCapability } from "../../../lib/eventOrganizing";

export default function EventOrganizingDashboard({
  params,
}: {
  params: { group: string; item: string };
}) {
  const found = findEventOrganizingCapability(params.group, params.item);
  if (!found) return notFound();
  const { group, item } = found;

  return (
    <CapabilityDashboard
      hubTitle="Event Organizing"
      hubHref="/event-organizing"
      group={group}
      item={item}
    />
  );
}
