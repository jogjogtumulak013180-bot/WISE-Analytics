import { notFound } from "next/navigation";
import CapabilityDashboard from "../../../components/CapabilityDashboard";
import { findConstructionCapability } from "../../../lib/constructionManagement";

export default function ConstructionDashboard({
  params,
}: {
  params: { group: string; item: string };
}) {
  const found = findConstructionCapability(params.group, params.item);
  if (!found) return notFound();
  const { group, item } = found;

  return (
    <CapabilityDashboard
      hubTitle="Construction Management"
      hubHref="/construction"
      group={group}
      item={item}
    />
  );
}
