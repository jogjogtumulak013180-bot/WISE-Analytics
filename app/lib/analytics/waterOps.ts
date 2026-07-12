// Analytics for Municipal Water Systems / Operations Monitoring.
// One water-ops-v1 import populates all 10 item dashboards.
// All figures are DERIVED here from core tables — never stored.

import { supabase } from "../supabase";

export interface Kpi {
  label: string;
  value: string;
  hint?: string;
}

export interface Series {
  name: string;
  points: { x: string; y: number }[];
}

export interface DashboardPayload {
  kpis: Kpi[];
  chart?: { title: string; kind: "line" | "bar"; series: Series[] };
  table?: { title: string; columns: string[]; rows: (string | number)[][] };
  note?: string;
}

interface ProdRow { period: string; source: string; volume_cum: number }
interface ConsRow { period: string; barangay: string; source: string | null; volume_cum: number }
interface CostRow { period: string; cost_type: string; ref: string | null; amount: number }
interface PressureRow { reading_date: string; location: string; pressure_psi: number }
interface LeakRow { report_date: string; location: string; description: string | null; repaired_date: string | null; status: string }
interface TankRow { reading_date: string; tank: string; level_m: number | null; capacity_cum: number | null }

async function fetchCore(projectId: string) {
  const [prod, cons, costs, pressure, leaks, tanks] = await Promise.all([
    supabase.from("core_water_production").select("period, source, volume_cum").eq("project_id", projectId).order("period"),
    supabase.from("core_water_consumption").select("period, barangay, source, volume_cum").eq("project_id", projectId).order("period"),
    supabase.from("core_water_costs").select("period, cost_type, ref, amount").eq("project_id", projectId).order("period"),
    supabase.from("core_water_pressure").select("reading_date, location, pressure_psi").eq("project_id", projectId).order("reading_date"),
    supabase.from("core_water_leaks").select("report_date, location, description, repaired_date, status").eq("project_id", projectId).order("report_date"),
    supabase.from("core_reservoir_levels").select("reading_date, tank, level_m, capacity_cum").eq("project_id", projectId).order("reading_date"),
  ]);
  return {
    prod: (prod.data ?? []) as ProdRow[],
    cons: (cons.data ?? []) as ConsRow[],
    costs: (costs.data ?? []) as CostRow[],
    pressure: (pressure.data ?? []) as PressureRow[],
    leaks: (leaks.data ?? []) as LeakRow[],
    tanks: (tanks.data ?? []) as TankRow[],
  };
}

const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-PH", { maximumFractionDigits: d, minimumFractionDigits: d });

const monthLabel = (period: string) =>
  new Date(period + "T00:00:00").toLocaleString("en", { month: "short" });

function sumBy<T>(rows: T[], key: (r: T) => string, val: (r: T) => number): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return m;
}

function seriesByGroup<T>(
  rows: T[],
  group: (r: T) => string,
  period: (r: T) => string,
  val: (r: T) => number
): Series[] {
  const groups = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const g = groups.get(group(r)) ?? new Map<string, number>();
    g.set(period(r), (g.get(period(r)) ?? 0) + val(r));
    groups.set(group(r), g);
  }
  return Array.from(groups.entries()).map(([name, m]) => ({
    name,
    points: Array.from(m.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, v]) => ({ x: monthLabel(p), y: Math.round(v) })),
  }));
}

const EMPTY_NOTE =
  "No data yet — create/upload the Operations Monitoring workbook for this project.";

export async function computeWaterOps(
  itemSlug: string,
  projectId: string
): Promise<DashboardPayload> {
  const core = await fetchCore(projectId);
  const { prod, cons, costs, pressure, leaks, tanks } = core;

  const prodByPeriod = sumBy(prod, (r) => r.period, (r) => r.volume_cum);
  const consByPeriod = sumBy(cons, (r) => r.period, (r) => r.volume_cum);
  const totalProd = prod.reduce((s, r) => s + r.volume_cum, 0);
  const totalCons = cons.reduce((s, r) => s + r.volume_cum, 0);

  switch (itemSlug) {
    case "production-monitoring": {
      if (prod.length === 0) return { kpis: [], note: EMPTY_NOTE };
      const bySource = sumBy(prod, (r) => r.source, (r) => r.volume_cum);
      const top = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);
      return {
        kpis: [
          { label: "Total Production", value: `${fmt(totalProd)} cu.m.` },
          { label: "Months Reported", value: String(prodByPeriod.size) },
          { label: "Sources", value: String(bySource.size) },
          { label: "Top Source", value: top[0] ? `${top[0][0]} (${fmt((top[0][1] / totalProd) * 100)}%)` : "—" },
        ],
        chart: {
          title: "Monthly production by source (cu.m.)",
          kind: "line",
          series: seriesByGroup(prod, (r) => r.source, (r) => r.period, (r) => r.volume_cum),
        },
        table: {
          title: "Production by source",
          columns: ["Source", "Total (cu.m.)", "Share"],
          rows: top.map(([s, v]) => [s, fmt(v), `${fmt((v / totalProd) * 100, 1)}%`]),
        },
      };
    }

    case "consumption-monitoring": {
      if (cons.length === 0) return { kpis: [], note: EMPTY_NOTE };
      const byBrgy = sumBy(cons, (r) => r.barangay, (r) => r.volume_cum);
      const top = Array.from(byBrgy.entries()).sort((a, b) => b[1] - a[1]);
      return {
        kpis: [
          { label: "Total Consumption", value: `${fmt(totalCons)} cu.m.` },
          { label: "Barangays", value: String(byBrgy.size) },
          { label: "Top Consumer", value: top[0] ? `${top[0][0]} (${fmt((top[0][1] / totalCons) * 100)}%)` : "—" },
          {
            label: "Avg Monthly",
            value: consByPeriod.size ? `${fmt(totalCons / consByPeriod.size)} cu.m.` : "—",
          },
        ],
        chart: {
          title: "Total monthly consumption (cu.m.)",
          kind: "bar",
          series: [
            {
              name: "Consumption",
              points: Array.from(consByPeriod.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([p, v]) => ({ x: monthLabel(p), y: Math.round(v) })),
            },
          ],
        },
        table: {
          title: "Consumption by barangay",
          columns: ["Barangay", "Total (cu.m.)", "Share"],
          rows: top.map(([b, v]) => [b, fmt(v), `${fmt((v / totalCons) * 100, 1)}%`]),
        },
      };
    }

    case "nrw-dashboard": {
      if (prod.length === 0 || cons.length === 0) return { kpis: [], note: EMPTY_NOTE };
      const periods = Array.from(
        new Set([...prodByPeriod.keys(), ...consByPeriod.keys()])
      ).sort();
      const nrwPts = periods.map((p) => {
        const pr = prodByPeriod.get(p) ?? 0;
        const co = consByPeriod.get(p) ?? 0;
        return { p, nrw: pr - co, pct: pr > 0 ? ((pr - co) / pr) * 100 : 0 };
      });
      const totalNrw = totalProd - totalCons;
      return {
        kpis: [
          { label: "Water Losses (NRW)", value: `${fmt(totalNrw)} cu.m.` },
          {
            label: "NRW %",
            value: totalProd > 0 ? `${fmt((totalNrw / totalProd) * 100, 1)}%` : "—",
            hint: "PWWA benchmark: ≤ 25%",
          },
          { label: "Production", value: `${fmt(totalProd)} cu.m.` },
          { label: "Consumption", value: `${fmt(totalCons)} cu.m.` },
        ],
        chart: {
          title: "NRW % by month",
          kind: "line",
          series: [
            { name: "NRW %", points: nrwPts.map((x) => ({ x: monthLabel(x.p), y: Math.round(x.pct * 10) / 10 })) },
          ],
        },
        table: {
          title: "Monthly water balance",
          columns: ["Month", "Production", "Consumption", "NRW (cu.m.)", "NRW %"],
          rows: nrwPts.map((x) => [
            monthLabel(x.p),
            fmt(prodByPeriod.get(x.p) ?? 0),
            fmt(consByPeriod.get(x.p) ?? 0),
            fmt(x.nrw),
            `${fmt(x.pct, 1)}%`,
          ]),
        },
      };
    }

    case "energy-monitoring": {
      const power = costs.filter((c) => c.cost_type === "power");
      if (power.length === 0) return { kpis: [], note: EMPTY_NOTE };
      const totalPower = power.reduce((s, r) => s + r.amount, 0);
      const byRef = sumBy(power, (r) => r.ref ?? "(unspecified)", (r) => r.amount);
      const top = Array.from(byRef.entries()).sort((a, b) => b[1] - a[1]);
      return {
        kpis: [
          { label: "Total Power Cost", value: `₱ ${fmt(totalPower)}` },
          {
            label: "Cost per cu.m.",
            value: totalCons > 0 ? `₱ ${fmt(totalPower / totalCons, 2)}` : "—",
            hint: "vs consumption",
          },
          { label: "Meters / Stations", value: String(byRef.size) },
          { label: "Top Cost Center", value: top[0]?.[0] ?? "—" },
        ],
        chart: {
          title: "Monthly power cost (₱)",
          kind: "bar",
          series: [
            {
              name: "Power",
              points: Array.from(sumBy(power, (r) => r.period, (r) => r.amount).entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([p, v]) => ({ x: monthLabel(p), y: Math.round(v) })),
            },
          ],
        },
        table: {
          title: "Power cost by meter / station",
          columns: ["Meter / Station", "Total (₱)", "Share"],
          rows: top.map(([r, v]) => [r, fmt(v), `${fmt((v / totalPower) * 100, 1)}%`]),
        },
      };
    }

    case "pump-operations": {
      const power = costs.filter((c) => c.cost_type === "power");
      const boosters = power.filter((r) => /booster|pump/i.test(r.ref ?? ""));
      if (power.length === 0) return { kpis: [], note: EMPTY_NOTE };
      const totBooster = boosters.reduce((s, r) => s + r.amount, 0);
      const totPower = power.reduce((s, r) => s + r.amount, 0);
      return {
        kpis: [
          { label: "Booster/Pump Stations", value: String(new Set(boosters.map((b) => b.ref)).size) },
          { label: "Booster Power Cost", value: `₱ ${fmt(totBooster)}` },
          {
            label: "Share of Power Cost",
            value: totPower > 0 ? `${fmt((totBooster / totPower) * 100, 1)}%` : "—",
          },
        ],
        chart: {
          title: "Monthly booster/pump power cost (₱)",
          kind: "line",
          series: seriesByGroup(boosters, (r) => r.ref ?? "?", (r) => r.period, (r) => r.amount),
        },
        note:
          boosters.length === 0
            ? "No meters matched 'booster' or 'pump' — name pump-station meters accordingly in the PowerCost sheet."
            : undefined,
      };
    }

    case "water-source-monitoring": {
      if (prod.length === 0) return { kpis: [], note: EMPTY_NOTE };
      const bySource = sumBy(prod, (r) => r.source, (r) => r.volume_cum);
      const entries = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);
      return {
        kpis: entries.slice(0, 4).map(([s, v]) => ({
          label: s,
          value: `${fmt(v)} cu.m.`,
          hint: `${fmt((v / totalProd) * 100, 1)}% of production`,
        })),
        chart: {
          title: "Source production profile (cu.m.)",
          kind: "line",
          series: seriesByGroup(prod, (r) => r.source, (r) => r.period, (r) => r.volume_cum),
        },
      };
    }

    case "pressure-monitoring": {
      if (pressure.length === 0)
        return { kpis: [], note: "No pressure readings in the uploaded workbook (PressureReadings sheet)." };
      const avg = pressure.reduce((s, r) => s + r.pressure_psi, 0) / pressure.length;
      const min = Math.min(...pressure.map((r) => r.pressure_psi));
      const max = Math.max(...pressure.map((r) => r.pressure_psi));
      const low = pressure.filter((r) => r.pressure_psi < 34.1); // LWUA min head ≈ 24m
      return {
        kpis: [
          { label: "Readings", value: String(pressure.length) },
          { label: "Average", value: `${fmt(avg, 1)} psi` },
          { label: "Min / Max", value: `${fmt(min, 1)} / ${fmt(max, 1)} psi` },
          { label: "Below 34.1 psi (24m)", value: String(low.length), hint: "LWUA minimum distribution head" },
        ],
        table: {
          title: "Latest readings",
          columns: ["Date", "Location", "Pressure (psi)"],
          rows: pressure.slice(-30).reverse().map((r) => [r.reading_date, r.location, fmt(r.pressure_psi, 1)]),
        },
      };
    }

    case "leak-monitoring": {
      if (leaks.length === 0)
        return { kpis: [], note: "No leak reports in the uploaded workbook (LeakReports sheet)." };
      const open = leaks.filter((l) => l.status !== "repaired");
      const repaired = leaks.filter((l) => l.status === "repaired" && l.repaired_date);
      const avgDays =
        repaired.length > 0
          ? repaired.reduce(
              (s, l) =>
                s +
                (new Date(l.repaired_date as string).getTime() - new Date(l.report_date).getTime()) /
                  86400000,
              0
            ) / repaired.length
          : null;
      return {
        kpis: [
          { label: "Reported Leaks", value: String(leaks.length) },
          { label: "Open", value: String(open.length) },
          { label: "Repaired", value: String(leaks.length - open.length) },
          { label: "Avg Days to Repair", value: avgDays === null ? "—" : fmt(avgDays, 1) },
        ],
        table: {
          title: "Leak log",
          columns: ["Reported", "Location", "Description", "Status", "Repaired"],
          rows: leaks
            .slice()
            .reverse()
            .map((l) => [l.report_date, l.location, l.description ?? "", l.status, l.repaired_date ?? ""]),
        },
      };
    }

    case "reservoir-monitoring": {
      if (tanks.length === 0)
        return { kpis: [], note: "No reservoir readings in the uploaded workbook (ReservoirLevels sheet)." };
      const byTank = new Map<string, TankRow[]>();
      for (const t of tanks) {
        byTank.set(t.tank, [...(byTank.get(t.tank) ?? []), t]);
      }
      return {
        kpis: Array.from(byTank.entries()).slice(0, 4).map(([tank, rows]) => {
          const latest = rows[rows.length - 1];
          return {
            label: tank,
            value: latest.level_m !== null ? `${fmt(latest.level_m, 2)} m` : "—",
            hint: `as of ${latest.reading_date}`,
          };
        }),
        chart: {
          title: "Reservoir level (m)",
          kind: "line",
          series: Array.from(byTank.entries()).map(([tank, rows]) => ({
            name: tank,
            points: rows
              .filter((r) => r.level_m !== null)
              .map((r) => ({ x: r.reading_date.slice(5), y: r.level_m as number })),
          })),
        },
      };
    }

    case "operations-dashboard": {
      if (prod.length === 0 && cons.length === 0) return { kpis: [], note: EMPTY_NOTE };
      const totalNrw = totalProd - totalCons;
      const power = costs.filter((c) => c.cost_type === "power");
      const totalPower = power.reduce((s, r) => s + r.amount, 0);
      const openLeaks = leaks.filter((l) => l.status !== "repaired").length;
      return {
        kpis: [
          { label: "Production", value: `${fmt(totalProd)} cu.m.` },
          { label: "Consumption", value: `${fmt(totalCons)} cu.m.` },
          {
            label: "NRW %",
            value: totalProd > 0 ? `${fmt((totalNrw / totalProd) * 100, 1)}%` : "—",
          },
          {
            label: "Power ₱/cu.m.",
            value: totalCons > 0 ? `₱ ${fmt(totalPower / totalCons, 2)}` : "—",
          },
          { label: "Open Leaks", value: String(openLeaks) },
        ],
        chart: {
          title: "Production vs Consumption (cu.m.)",
          kind: "line",
          series: [
            {
              name: "Production",
              points: Array.from(prodByPeriod.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([p, v]) => ({ x: monthLabel(p), y: Math.round(v) })),
            },
            {
              name: "Consumption",
              points: Array.from(consByPeriod.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([p, v]) => ({ x: monthLabel(p), y: Math.round(v) })),
            },
          ],
        },
      };
    }

    default:
      return { kpis: [], note: "Analytics for this item are not defined yet." };
  }
}
