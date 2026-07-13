import type { TemplateDef } from "./types";
import { num } from "./types";

// Event Organizing templates v1 — light analytics per your decision:
// participants, attendance, pre/post-test scores, evaluation ratings.

const participantSheet = {
  name: "Participants",
  layout: "long" as const,
  columns: [
    { key: "participant", header: "PARTICIPANT NAME", type: "text" as const, required: true },
    { key: "office", header: "OFFICE / LGU", type: "text" as const, required: false },
    { key: "sex", header: "SEX", type: "enum" as const, required: false, enumValues: ["male", "female"] },
    { key: "days_attended", header: "DAYS ATTENDED", type: "number" as const, required: false, min: 0 },
    { key: "total_days", header: "TOTAL TRAINING DAYS", type: "number" as const, required: false, min: 1 },
    { key: "certificate_issued", header: "CERTIFICATE ISSUED", type: "enum" as const, required: false, enumValues: ["yes", "no"] },
  ],
  exampleRows: [["Juan Dela Cruz", "MPDO Sogod", "male", 3, 3, "yes"]],
};

const sessionsSheet = {
  name: "Sessions",
  layout: "long" as const,
  columns: [
    { key: "session_date", header: "DATE", type: "date" as const, required: true },
    { key: "module", header: "MODULE / TOPIC", type: "text" as const, required: true },
    { key: "facilitator", header: "FACILITATOR", type: "text" as const, required: false },
    { key: "duration_hours", header: "DURATION (HOURS)", type: "number" as const, required: false, min: 0 },
    { key: "attendees", header: "ATTENDEES", type: "number" as const, required: false, min: 0 },
  ],
  exampleRows: [["2026-05-12", "Module 1: CBMS data appreciation", "J. Tumulak", 4, 28]],
};

const scoresSheet = {
  name: "Scores",
  layout: "long" as const,
  columns: [
    { key: "participant", header: "PARTICIPANT NAME", type: "text" as const, required: true, note: "must match the Participants sheet" },
    { key: "pre_test", header: "PRE-TEST SCORE", type: "number" as const, required: false, min: 0, max: 100 },
    { key: "post_test", header: "POST-TEST SCORE", type: "number" as const, required: false, min: 0, max: 100 },
    {
      key: "gain", header: "GAIN", type: "number" as const, required: false,
      derive: (r: Record<string, unknown>) => {
        const pre = num(r, "pre_test"); const post = num(r, "post_test");
        return pre !== null && post !== null ? post - pre : null;
      },
      note: "post − pre; auto-recomputed if broken",
    },
  ],
  exampleRows: [["Juan Dela Cruz", 55, 82, 27]],
};

const evaluationsSheet = {
  name: "Evaluations",
  layout: "long" as const,
  columns: [
    { key: "participant", header: "PARTICIPANT NAME", type: "text" as const, required: false, note: "blank for anonymous evaluations" },
    {
      key: "criteria", header: "CRITERIA", type: "enum" as const, required: true,
      enumValues: ["content relevance", "facilitator effectiveness", "materials quality", "venue & logistics", "overall satisfaction"],
    },
    { key: "rating", header: "RATING (1-5)", type: "number" as const, required: true, min: 1, max: 5 },
    { key: "comments", header: "COMMENTS", type: "text" as const, required: false },
  ],
  exampleRows: [["", "overall satisfaction", 5, "Very practical, apply immediately"]],
};

export const EVENT_DESIGN_V1: TemplateDef = {
  code: "event-design-v1",
  title: "Training Design & Delivery — Data Template v1",
  pillar: "event-organizing",
  subPillar: "training-design-delivery",
  fileName: "WISE_TrainingDesign_Template_v1.xlsx",
  projectFields: [
    { key: "training_title", label: "Training Title", kind: "text" },
    { key: "venue", label: "Venue", kind: "text" },
  ],
  sheets: [sessionsSheet, participantSheet],
};

export const EVENT_TRACKS_V1: TemplateDef = {
  code: "event-tracks-v1",
  title: "Core Capability Training Tracks — Data Template v1",
  pillar: "event-organizing",
  subPillar: "core-capability-training-tracks",
  fileName: "WISE_TrainingTracks_Template_v1.xlsx",
  projectFields: [
    { key: "track", label: "Track (DPMS / Dev Planning / Construction / Water Systems)", kind: "text" },
  ],
  sheets: [sessionsSheet, participantSheet, scoresSheet],
};

export const EVENT_EVAL_V1: TemplateDef = {
  code: "event-eval-v1",
  title: "Training Evaluation & Report — Data Template v1",
  pillar: "event-organizing",
  subPillar: "training-evaluation-report",
  fileName: "WISE_TrainingEvaluation_Template_v1.xlsx",
  projectFields: [
    { key: "training_title", label: "Training Title", kind: "text" },
  ],
  sheets: [participantSheet, scoresSheet, evaluationsSheet],
};
