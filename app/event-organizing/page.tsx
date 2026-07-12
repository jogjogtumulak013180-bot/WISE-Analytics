import CapabilityHub from "../components/CapabilityHub";
import { EVENT_ORGANIZING_GROUPS, EVENT_ORGANIZING_TOTAL_COUNT } from "../lib/eventOrganizing";

export default function EventOrganizingHub() {
  return (
    <CapabilityHub
      eyebrow="EVENT ORGANIZING · TRAININGS, SEMINARS & WORKSHOPS"
      title="Event Organizing"
      subtitle={`${EVENT_ORGANIZING_TOTAL_COUNT} capability areas covering the design, delivery, and evaluation of trainings, seminars, and workshops that build LGU capacity in DPMS, development planning, construction management, and water systems.`}
      groups={EVENT_ORGANIZING_GROUPS}
      basePath="/event-organizing"
    />
  );
}
