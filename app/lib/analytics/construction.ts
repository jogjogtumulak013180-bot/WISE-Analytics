// Analytics for Construction Management (Project Delivery + Schedule & Cost Control).
// Every figure here is DERIVED — computed server-side by Postgres views in
// derived_pm/analytics_pm and reached through public.pm_* RPC wrappers (staging_pm/
// core_pm/derived_pm/analytics_pm are not PostgREST-exposed schemas, so the app
// never queries them with supabase.from(); it always goes through an RPC).

import { supabase } from "../supabase";
import type { Kpi, Series, DashboardPayload } from "./waterOps";

export type { Kpi, Series, DashboardPayload };

interface PowItem {
  item_no: string; description: string; qty: number | null; unit: string | null;
  unit_cost: number | null; amount: number; materials: number; equipment: number;
  manpower: number; mob_demob: number; ocm: number; profit: number; vat: number; total_amount: number;
}
interface ScurvePoint {
  period: string; month_offset: number; planned_cum_pct: number | null; planned_cum_amount: number | null;
  actual_cum_pct: number | null; actual_cum_cost: number | null;
}
interface EvmRow {
  period: string; month_offset: number; pv: number; ev: number; ac: number | null;
  planned_cum_pct: number; actual_cum_pct: number | null; cv: number; sv: number;
  cpi: number | null; spi: number | null;
}
interface CostByDivision {
  division: string; division_seq: number; amount: number; materials: number;
  equipment: number; manpower: number; indirect: number; pct_of_total: number;
}
interface CostByResource { resource_type: string; amount: number | null }
interface VoRow { vo_no: string; vo_date: string; description: string; amount: number; time_extension_days: number; status: string }
interface VoSummary {
  original_contract_amount: number; approved_vo_amount: number; pending_vo_amount: number;
  revised_contract_amount: number; approved_time_extension_days: number; vo_count: number;
}
interface QualityTest { test_date: string; item_no: string | null; test_type: string; result: string | null; passed: boolean; remarks: string | null }
interface QualitySummary { total_tests: number; passed_tests: number; pass_rate_pct: number | null }
interface SafetyLog { log_date: string; incident_type: string; severity: string | null; manhours_lost: number; remarks: string | null }
interface SafetySummary { total_incidents: number; high_severity: number; medium_severity: number; low_severity: number; total_manhours_lost: number; last_incident_date: string | null }
interface PunchItem { ref_no: string; location: string; description: string; raised_date: string; closed_date: string | null; status: string }
interface PunchSummary { total_items: number; open_items: number; closed_items: number; avg_days_to_close: number | null }
interface AsBuiltDoc { doc_no: string; title: string; discipline: string | null; revision: string | null; submitted_date: string | null; status: string }
interface ProjectSchedule { start_date: string; duration_months: number }
interface ProjectKpis {
  start_date: string; duration_months: number; planned_end_date: string;
  original_contract_amount: number; revised_contract_amount: number | null;
  approved_time_extension_days: number | null; as_of_period: string | null;
  planned_cum_pct: number | null; actual_cum_pct: number | null; pct_variance: number | null;
  spi: number | null; cpi: number | null; sv: number | null; cv: number | null;
  quality_pass_rate_pct: number | null; safety_incidents: number | null;
  safety_manhours_lost: number | null; open_punch_items: number | null; total_punch_items: number | null;
}

async function rpc<T>(fn: string, projectId: string): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, { p_project_id: projectId });
  if (error) return [];
  return (data ?? []) as T[];
}

const fmt = (n: number | null | undefined, d = 0) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : n.toLocaleString("en-PH", { maximumFractionDigits: d, minimumFractionDigits: d });
const peso = (n: number | null | undefined, d = 0) => (n === null || n === undefined ? "—" : `₱ ${fmt(n, d)}`);
const pct = (n: number | null | undefined, d = 1) => (n === null || n === undefined ? "—" : `${fmt(n, d)}%`);
const monthLabel = (period: string) =>
  new Date(period + "T00:00:00").toLocaleString("en", { month: "short", year: "2-digit" });

const NO_SCHEDULE_NOTE =
  "No planned schedule yet — set the project start date and duration (5-month default) to generate the S-curve baseline from the POW.";
const NO_POW_NOTE =
  "No Program of Works imported yet — upload the POW/BOQ/DUPA workbook for this project.";

export async function computeConstruction(itemSlug: string, projectId: string): Promise<DashboardPayload> {
  switch (itemSlug) {
    case "schedule-gantt-scurve": {
      const [scurve, schedule, pow] = await Promise.all([
        rpc<ScurvePoint>("pm_scurve", projectId),
        rpc<ProjectSchedule>("pm_schedule", projectId),
        rpc<PowItem>("pm_pow_items", projectId),
      ]);
      if (schedule.length === 0) return { kpis: [], note: NO_SCHEDULE_NOTE };
      if (pow.length === 0) return { kpis: [], note: NO_POW_NOTE };
      const latest = scurve[scurve.length - 1];
      const latestActual = [...scurve].reverse().find((p) => p.actual_cum_pct && p.actual_cum_pct > 0);
      return {
        kpis: [
          { label: "Planned % (to date)", value: pct(latest?.planned_cum_pct) },
          { label: "Actual % (to date)", value: pct(latestActual?.actual_cum_pct ?? 0) },
          {
            label: "Variance",
            value: latestActual ? pct((latestActual.actual_cum_pct ?? 0) - (latestActual.planned_cum_pct ?? 0)) : "—",
            hint: "actual minus planned",
          },
          { label: "Duration", value: `${schedule[0].duration_months} months`, hint: `from ${schedule[0].start_date}` },
        ],
        chart: {
          title: "S-Curve — Planned vs. Actual Cumulative Progress (%)",
          kind: "line",
          series: [
            { name: "Planned", points: scurve.map((p) => ({ x: monthLabel(p.period), y: p.planned_cum_pct ?? 0 })) },
            { name: "Actual", points: scurve.map((p) => ({ x: monthLabel(p.period), y: p.actual_cum_pct ?? 0 })) },
          ],
        },
        table: {
          title: "Monthly progress",
          columns: ["Period", "Planned %", "Actual %", "Variance"],
          rows: scurve.map((p) => [
            monthLabel(p.period),
            pct(p.planned_cum_pct),
            pct(p.actual_cum_pct ?? 0),
            pct((p.actual_cum_pct ?? 0) - (p.planned_cum_pct ?? 0)),
          ]),
        },
      };
    }

    case "cost-budget-monitoring": {
      const [evm, byDivision, byResource, kpis] = await Promise.all([
        rpc<EvmRow>("pm_evm", projectId),
        rpc<CostByDivision>("pm_cost_by_division", projectId),
        rpc<CostByResource>("pm_cost_by_resource", projectId),
        rpc<ProjectKpis>("pm_project_kpis", projectId),
      ]);
      if (byDivision.length === 0) return { kpis: [], note: NO_POW_NOTE };
      const k = kpis[0];
      return {
        kpis: [
          { label: "Contract Amount", value: peso(k?.original_contract_amount) },
          { label: "Revised Amount", value: peso(k?.revised_contract_amount ?? k?.original_contract_amount) },
          { label: "CPI", value: k?.cpi ? fmt(k.cpi, 2) : "—", hint: "> 1.0 = under budget" },
          { label: "Cost Variance (CV)", value: k?.cv !== undefined ? peso(k.cv) : "—" },
        ],
        chart: {
          title: "Planned Value vs. Earned Value vs. Actual Cost (₱)",
          kind: "line",
          series: [
            { name: "PV (Planned)", points: evm.map((e) => ({ x: monthLabel(e.period), y: Math.round(e.pv) })) },
            { name: "EV (Earned)", points: evm.map((e) => ({ x: monthLabel(e.period), y: Math.round(e.ev) })) },
            { name: "AC (Actual)", points: evm.map((e) => ({ x: monthLabel(e.period), y: Math.round(e.ac ?? 0) })) },
          ],
        },
        table: {
          title: "Cost by BOQ/POW division",
          columns: ["Div.", "Materials", "Equipment", "Manpower", "Indirect", "Amount", "Share"],
          rows: byDivision.map((d) => [
            d.division, fmt(d.materials), fmt(d.equipment), fmt(d.manpower), fmt(d.indirect), fmt(d.amount), pct(d.pct_of_total),
          ]),
        },
        note:
          byResource.length > 0
            ? `Resource mix: ${byResource.map((r) => `${r.resource_type} ${peso(r.amount)}`).join(" · ")}`
            : undefined,
      };
    }

    case "project-monitoring": {
      const [kpis, scurve] = await Promise.all([
        rpc<ProjectKpis>("pm_project_kpis", projectId),
        rpc<ScurvePoint>("pm_scurve", projectId),
      ]);
      if (kpis.length === 0) return { kpis: [], note: NO_SCHEDULE_NOTE };
      const k = kpis[0];
      return {
        kpis: [
          { label: "Planned %", value: pct(k.planned_cum_pct) },
          { label: "Actual %", value: pct(k.actual_cum_pct ?? 0) },
          { label: "SPI", value: k.spi ? fmt(k.spi, 2) : "—" },
          { label: "CPI", value: k.cpi ? fmt(k.cpi, 2) : "—" },
          { label: "Open Punch Items", value: String(k.open_punch_items ?? 0) },
          { label: "Safety Incidents", value: String(k.safety_incidents ?? 0) },
          { label: "Quality Pass Rate", value: pct(k.quality_pass_rate_pct) },
          { label: "Planned End", value: k.planned_end_date },
        ],
        chart: scurve.length
          ? {
              title: "S-Curve — Planned vs. Actual (%)",
              kind: "line",
              series: [
                { name: "Planned", points: scurve.map((p) => ({ x: monthLabel(p.period), y: p.planned_cum_pct ?? 0 })) },
                { name: "Actual", points: scurve.map((p) => ({ x: monthLabel(p.period), y: p.actual_cum_pct ?? 0 })) },
              ],
            }
          : undefined,
      };
    }

    case "variation-orders": {
      const [vos, summary] = await Promise.all([
        rpc<VoRow>("pm_variation_orders", projectId),
        rpc<VoSummary>("pm_vo_summary", projectId),
      ]);
      const s = summary[0];
      if (!s) return { kpis: [], note: NO_POW_NOTE };
      return {
        kpis: [
          { label: "Original Contract", value: peso(s.original_contract_amount) },
          { label: "Approved VOs", value: peso(s.approved_vo_amount) },
          { label: "Pending VOs", value: peso(s.pending_vo_amount) },
          { label: "Revised Contract", value: peso(s.revised_contract_amount) },
          { label: "Time Extension", value: `${fmt(s.approved_time_extension_days)} days` },
        ],
        table: {
          title: "Variation orders",
          columns: ["VO No.", "Date", "Description", "Amount", "Time Ext.", "Status"],
          rows: vos.map((v) => [v.vo_no, v.vo_date, v.description, peso(v.amount), `${v.time_extension_days}d`, v.status]),
        },
        note: vos.length === 0 ? "No variation orders logged (VariationOrders sheet)." : undefined,
      };
    }

    case "contract-management": {
      const [pow, schedule, kpis] = await Promise.all([
        rpc<PowItem>("pm_pow_items", projectId),
        rpc<ProjectSchedule>("pm_schedule", projectId),
        rpc<ProjectKpis>("pm_project_kpis", projectId),
      ]);
      if (pow.length === 0) return { kpis: [], note: NO_POW_NOTE };
      const totalAmount = pow.reduce((s, r) => s + (r.amount ?? 0), 0);
      const k = kpis[0];
      return {
        kpis: [
          { label: "Contract Amount", value: peso(totalAmount) },
          { label: "Start Date", value: schedule[0]?.start_date ?? "not set" },
          { label: "Duration", value: schedule[0] ? `${schedule[0].duration_months} months` : "not set" },
          { label: "Planned End", value: k?.planned_end_date ?? "—" },
        ],
        table: {
          title: "Program of Works (contract line items)",
          columns: ["Item No.", "Description", "Qty", "Unit", "Unit Cost", "Total Amount"],
          rows: pow.map((p) => [p.item_no, p.description, fmt(p.qty ?? 0, 2), p.unit ?? "", peso(p.unit_cost), peso(p.total_amount)]),
        },
      };
    }

    case "quality-control": {
      const [tests, summary] = await Promise.all([
        rpc<QualityTest>("pm_quality_tests", projectId),
        rpc<QualitySummary>("pm_quality_summary", projectId),
      ]);
      const s = summary[0];
      if (!s || tests.length === 0) return { kpis: [], note: "No quality tests logged (QualityTests sheet)." };
      return {
        kpis: [
          { label: "Total Tests", value: String(s.total_tests) },
          { label: "Passed", value: String(s.passed_tests) },
          { label: "Pass Rate", value: pct(s.pass_rate_pct) },
        ],
        table: {
          title: "Quality test log",
          columns: ["Date", "Item No.", "Test Type", "Result", "Passed", "Remarks"],
          rows: tests.map((t) => [t.test_date, t.item_no ?? "", t.test_type, t.result ?? "", t.passed ? "yes" : "no", t.remarks ?? ""]),
        },
      };
    }

    case "safety-monitoring": {
      const [logs, summary] = await Promise.all([
        rpc<SafetyLog>("pm_safety_logs", projectId),
        rpc<SafetySummary>("pm_safety_summary", projectId),
      ]);
      const s = summary[0];
      if (!s || logs.length === 0) return { kpis: [], note: "No safety log entries yet (SafetyLog sheet)." };
      return {
        kpis: [
          { label: "Total Entries", value: String(s.total_incidents) },
          { label: "High Severity", value: String(s.high_severity) },
          { label: "Manhours Lost", value: fmt(s.total_manhours_lost) },
          { label: "Last Incident", value: s.last_incident_date ?? "none" },
        ],
        table: {
          title: "Safety log",
          columns: ["Date", "Type", "Severity", "Manhours Lost", "Remarks"],
          rows: logs.map((l) => [l.log_date, l.incident_type, l.severity ?? "", fmt(l.manhours_lost), l.remarks ?? ""]),
        },
      };
    }

    case "punch-list-deficiency-tracking": {
      const [items, summary] = await Promise.all([
        rpc<PunchItem>("pm_punch_list", projectId),
        rpc<PunchSummary>("pm_punch_summary", projectId),
      ]);
      const s = summary[0];
      if (!s || items.length === 0) return { kpis: [], note: "No punch-list items logged (PunchList sheet)." };
      return {
        kpis: [
          { label: "Total Items", value: String(s.total_items) },
          { label: "Open", value: String(s.open_items) },
          { label: "Closed", value: String(s.closed_items) },
          { label: "Avg Days to Close", value: s.avg_days_to_close !== null ? fmt(s.avg_days_to_close, 1) : "—" },
        ],
        table: {
          title: "Punch list",
          columns: ["Ref.", "Location", "Description", "Raised", "Closed", "Status"],
          rows: items.map((i) => [i.ref_no, i.location, i.description, i.raised_date, i.closed_date ?? "", i.status]),
        },
      };
    }

    case "as-built-documentation": {
      const docs = await rpc<AsBuiltDoc>("pm_as_built", projectId);
      if (docs.length === 0) return { kpis: [], note: "No as-built documents logged (AsBuiltRegister sheet)." };
      const approved = docs.filter((d) => d.status === "approved").length;
      return {
        kpis: [
          { label: "Total Documents", value: String(docs.length) },
          { label: "Approved", value: String(approved) },
          { label: "Pending", value: String(docs.length - approved) },
        ],
        table: {
          title: "As-built register",
          columns: ["Doc No.", "Title", "Discipline", "Revision", "Submitted", "Status"],
          rows: docs.map((d) => [d.doc_no, d.title, d.discipline ?? "", d.revision ?? "", d.submitted_date ?? "", d.status]),
        },
      };
    }

    default:
      return { kpis: [], note: "Analytics for this item are not defined yet." };
  }
}
