"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface PowItemOpt { item_no: string; description: string }
interface ScheduleRow { start_date: string; duration_months: number }

export default function ScheduleAndProgress({
  projectId,
  refresh,
}: {
  projectId: string;
  refresh: () => void;
}) {
  const [items, setItems] = useState<PowItemOpt[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow | null>(null);

  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("5");
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);
  const [scheduleBusy, setScheduleBusy] = useState(false);

  const [itemNo, setItemNo] = useState("");
  const [period, setPeriod] = useState("");
  const [actualPct, setActualPct] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progressBusy, setProgressBusy] = useState(false);

  useEffect(() => {
    supabase
      .rpc("pm_pow_items", { p_project_id: projectId })
      .then(({ data }) => {
        const opts = (data ?? []) as PowItemOpt[];
        setItems(opts);
        setItemNo((prev) => prev || opts[0]?.item_no || "");
      });
    supabase
      .rpc("pm_schedule", { p_project_id: projectId })
      .then(({ data }) => {
        const rows = (data ?? []) as ScheduleRow[];
        if (rows[0]) {
          setSchedule(rows[0]);
          setStartDate(rows[0].start_date);
          setDuration(String(rows[0].duration_months));
        } else {
          setSchedule(null);
        }
      });
  }, [projectId]);

  async function saveSchedule() {
    if (!startDate || !duration) return;
    setScheduleBusy(true);
    setScheduleMsg(null);
    const { error } = await supabase.rpc("set_pm_schedule", {
      p_project_id: projectId,
      p_start_date: startDate,
      p_duration_months: Number(duration),
    });
    setScheduleBusy(false);
    if (error) {
      setScheduleMsg(`Error: ${error.message}`);
    } else {
      setScheduleMsg("Saved. The planned S-curve is derived from the POW using this start date and duration.");
      setSchedule({ start_date: startDate, duration_months: Number(duration) });
      refresh();
    }
  }

  async function saveProgress() {
    if (!itemNo || !period) return;
    setProgressBusy(true);
    setProgressMsg(null);
    const { error } = await supabase.rpc("upsert_pm_progress", {
      p_project_id: projectId,
      p_item_no: itemNo,
      p_period: `${period}-01`,
      p_actual_pct: actualPct ? Number(actualPct) : null,
      p_actual_cost: actualCost ? Number(actualCost) : null,
    });
    setProgressBusy(false);
    if (error) {
      setProgressMsg(`Error: ${error.message}`);
    } else {
      setProgressMsg("Saved.");
      setActualPct("");
      setActualCost("");
      refresh();
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Schedule baseline</div>
        <p style={styles.p}>
          Set once (or update if the contract duration changes). The planned
          S-curve is derived entirely from the POW's cost-weighted item sequence
          — no other input needed.
        </p>
        <div style={styles.row}>
          <label style={styles.label}>
            Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
          </label>
          <label style={styles.label}>
            Duration (months)
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
        <button onClick={saveSchedule} disabled={scheduleBusy || !startDate} style={styles.button}>
          {schedule ? "Update schedule" : "Set schedule"}
        </button>
        {scheduleMsg && <div style={styles.msg}>{scheduleMsg}</div>}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Record actual progress</div>
        <p style={styles.p}>
          Enter this item&apos;s cumulative % complete (and cost to date, optional)
          as of a reporting month. Re-enter the same item/period to update it.
        </p>
        {items.length === 0 ? (
          <div style={styles.msg}>Import the POW/BOQ workbook first — items come from there.</div>
        ) : (
          <>
            <div style={styles.row}>
              <label style={styles.label}>
                Item
                <select value={itemNo} onChange={(e) => setItemNo(e.target.value)} style={styles.input}>
                  {items.map((i) => (
                    <option key={i.item_no} value={i.item_no}>
                      {i.item_no} — {i.description.slice(0, 30)}
                    </option>
                  ))}
                </select>
              </label>
              <label style={styles.label}>
                Period (month)
                <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} style={styles.input} />
              </label>
            </div>
            <div style={styles.row}>
              <label style={styles.label}>
                Actual % complete (cumulative)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={actualPct}
                  onChange={(e) => setActualPct(e.target.value)}
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Actual cost to date (₱, optional)
                <input
                  type="number"
                  min={0}
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  style={styles.input}
                />
              </label>
            </div>
            <button onClick={saveProgress} disabled={progressBusy || !period} style={styles.button}>
              Save entry
            </button>
            {progressMsg && <div style={styles.msg}>{progressMsg}</div>}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "16px 18px",
  },
  cardTitle: { fontSize: 13, fontWeight: 700, marginBottom: 8 },
  p: { fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 },
  row: { display: "flex", gap: 12, marginBottom: 10 },
  label: { display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", flex: 1 },
  input: {
    background: "var(--navy-950)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    fontWeight: 400,
  },
  button: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 12.5,
    cursor: "pointer",
  },
  msg: { marginTop: 10, fontSize: 12, color: "var(--text-secondary)" },
};
