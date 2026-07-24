import { Suspense } from "react";
import { notFound } from "next/navigation";
import CapabilityDashboard from "../../../components/CapabilityDashboard";
import { findConstructionCapability } from "../../../lib/constructionManagement";
import AnalyticsPanel from "../../../components/AnalyticsPanel";
import ScheduleAndProgress from "../../../components/ScheduleAndProgress";

export default function ConstructionDashboard({
  params,
}: {
  params: { group: string; item: string };
}) {
  const found = findConstructionCapability(params.group, params.item);
  if (!found) return notFound();
  const { group, item } = found;

  // Project Delivery + Schedule & Cost Control both write into the same
  // project's core_pm tables (staging_pm/core_pm/derived_pm/analytics_pm), so
  // every construction project is offered regardless of which sub-pillar it
  // was created under (matchSubPillar=false).
  const content = (
    <Suspense>
      <AnalyticsPanel
        pillar="construction"
        group={group.slug}
        item={item.slug}
        matchSubPillar={false}
        renderExtra={
          item.slug === "schedule-gantt-scurve"
            ? ({ projectId, refresh }) => <ScheduleAndProgress projectId={projectId} refresh={refresh} />
            : undefined
        }
      />
    </Suspense>
  );

  return (
    <CapabilityDashboard hubTitle="Construction Management" hubHref="/construction" group={group} item={item}>
      {content}
    </CapabilityDashboard>
  );
}
