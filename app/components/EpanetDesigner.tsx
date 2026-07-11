"use client";

import { useState } from "react";

interface Reservoir {
  id: string;
  head: number;
}
interface Junction {
  id: string;
  elevation: number;
  demand: number;
}
interface Pipe {
  id: string;
  from: string;
  to: string;
  length: number;
  diameter: number;
  roughness: number;
}

interface JunctionResult extends Junction {
  pressure: number;
  computedHead: number;
}
interface PipeResult extends Pipe {
  flow: number;
  velocity: number;
  headloss: number;
}

export default function EpanetDesigner() {
  const [reservoirs, setReservoirs] = useState<Reservoir[]>([{ id: "R1", head: 100 }]);
  const [junctions, setJunctions] = useState<Junction[]>([
    { id: "J1", elevation: 80, demand: 10 },
    { id: "J2", elevation: 60, demand: 15 },
  ]);
  const [pipes, setPipes] = useState<Pipe[]>([
    { id: "P1", from: "R1", to: "J1", length: 500, diameter: 150, roughness: 120 },
    { id: "P2", from: "J1", to: "J2", length: 400, diameter: 100, roughness: 120 },
  ]);

  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [junctionResults, setJunctionResults] = useState<JunctionResult[] | null>(null);
  const [pipeResults, setPipeResults] = useState<PipeResult[] | null>(null);

  async function runSimulation() {
    setRunning(true);
    setErrorMsg(null);
    setJunctionResults(null);
    setPipeResults(null);

    try {
      const { Workspace, Project, NodeType, LinkType, NodeProperty, LinkProperty, FlowUnits, HeadLossType } =
        await import("epanet-js");

      const ws = new Workspace();
      await ws.loadModule();
      const model = new Project(ws);

      model.init("report.rpt", "out.bin", FlowUnits.LPS, HeadLossType.HW);

      reservoirs.forEach((r) => {
        const idx = model.addNode(r.id, NodeType.Reservoir);
        model.setNodeValue(idx, NodeProperty.Elevation, r.head);
      });

      junctions.forEach((j) => {
        const idx = model.addNode(j.id, NodeType.Junction);
        model.setNodeValue(idx, NodeProperty.Elevation, j.elevation);
        model.setNodeValue(idx, NodeProperty.BaseDemand, j.demand);
      });

      pipes.forEach((p) => {
        const idx = model.addLink(p.id, LinkType.Pipe, p.from, p.to);
        model.setLinkValue(idx, LinkProperty.Length, p.length);
        model.setLinkValue(idx, LinkProperty.Diameter, p.diameter);
        model.setLinkValue(idx, LinkProperty.Roughness, p.roughness);
      });

      model.solveH();

      const jResults: JunctionResult[] = junctions.map((j) => {
        const idx = model.getNodeIndex(j.id);
        return {
          ...j,
          pressure: round(model.getNodeValue(idx, NodeProperty.Pressure)),
          computedHead: round(model.getNodeValue(idx, NodeProperty.Head)),
        };
      });

      const pResults: PipeResult[] = pipes.map((p) => {
        const idx = model.getLinkIndex(p.id);
        return {
          ...p,
          flow: round(model.getLinkValue(idx, LinkProperty.Flow)),
          velocity: round(model.getLinkValue(idx, LinkProperty.Velocity)),
          headloss: round(model.getLinkValue(idx, LinkProperty.Headloss)),
        };
      });

      model.close();

      setJunctionResults(jResults);
      setPipeResults(pResults);
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    } finally {
      setRunning(false);
    }
  }

  function round(n: number) {
    return Math.round(n * 100) / 100;
  }

  function updateReservoir(i: number, patch: Partial<Reservoir>) {
    setReservoirs((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function updateJunction(i: number, patch: Partial<Junction>) {
    setJunctions((prev) => prev.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));
  }
  function updatePipe(i: number, patch: Partial<Pipe>) {
    setPipes((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  return (
    <div>
      <div style={styles.notice}>
        Real hydraulic solver — runs the OWA-EPANET 2.2 toolkit compiled to
        WebAssembly, directly in your browser (via <code>epanet-js</code>). Units:
        meters, liters/second, Hazen-Williams roughness.
      </div>

      {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

      <Section title="Reservoirs">
        <Table
          headers={["ID", "Head (m)", ""]}
          rows={reservoirs.map((r, i) => [
            <input key="id" style={styles.input} value={r.id} onChange={(e) => updateReservoir(i, { id: e.target.value })} />,
            <input key="head" type="number" style={styles.input} value={r.head} onChange={(e) => updateReservoir(i, { head: Number(e.target.value) })} />,
            <button key="del" style={styles.deleteBtn} onClick={() => setReservoirs((p) => p.filter((_, idx) => idx !== i))}>
              Remove
            </button>,
          ])}
        />
        <button style={styles.addBtn} onClick={() => setReservoirs((p) => [...p, { id: `R${p.length + 1}`, head: 100 }])}>
          + Add Reservoir
        </button>
      </Section>

      <Section title="Junctions">
        <Table
          headers={["ID", "Elevation (m)", "Demand (LPS)", ""]}
          rows={junctions.map((j, i) => [
            <input key="id" style={styles.input} value={j.id} onChange={(e) => updateJunction(i, { id: e.target.value })} />,
            <input key="elev" type="number" style={styles.input} value={j.elevation} onChange={(e) => updateJunction(i, { elevation: Number(e.target.value) })} />,
            <input key="dem" type="number" style={styles.input} value={j.demand} onChange={(e) => updateJunction(i, { demand: Number(e.target.value) })} />,
            <button key="del" style={styles.deleteBtn} onClick={() => setJunctions((p) => p.filter((_, idx) => idx !== i))}>
              Remove
            </button>,
          ])}
        />
        <button style={styles.addBtn} onClick={() => setJunctions((p) => [...p, { id: `J${p.length + 1}`, elevation: 75, demand: 10 }])}>
          + Add Junction
        </button>
      </Section>

      <Section title="Pipes">
        <Table
          headers={["ID", "From", "To", "Length (m)", "Diameter (mm)", "Roughness (C)", ""]}
          rows={pipes.map((p, i) => [
            <input key="id" style={styles.input} value={p.id} onChange={(e) => updatePipe(i, { id: e.target.value })} />,
            <input key="from" style={styles.input} value={p.from} onChange={(e) => updatePipe(i, { from: e.target.value })} />,
            <input key="to" style={styles.input} value={p.to} onChange={(e) => updatePipe(i, { to: e.target.value })} />,
            <input key="len" type="number" style={styles.input} value={p.length} onChange={(e) => updatePipe(i, { length: Number(e.target.value) })} />,
            <input key="dia" type="number" style={styles.input} value={p.diameter} onChange={(e) => updatePipe(i, { diameter: Number(e.target.value) })} />,
            <input key="rough" type="number" style={styles.input} value={p.roughness} onChange={(e) => updatePipe(i, { roughness: Number(e.target.value) })} />,
            <button key="del" style={styles.deleteBtn} onClick={() => setPipes((p2) => p2.filter((_, idx) => idx !== i))}>
              Remove
            </button>,
          ])}
        />
        <button style={styles.addBtn} onClick={() => setPipes((p) => [...p, { id: `P${p.length + 1}`, from: "", to: "", length: 300, diameter: 100, roughness: 120 }])}>
          + Add Pipe
        </button>
      </Section>

      <button style={styles.runBtn} onClick={runSimulation} disabled={running}>
        {running ? "Solving…" : "Run Simulation"}
      </button>

      {junctionResults && (
        <Section title="Results — Junctions">
          <Table
            headers={["ID", "Elevation (m)", "Demand (LPS)", "Pressure (m)", "Hydraulic Head (m)"]}
            rows={junctionResults.map((r) => [r.id, r.elevation, r.demand, r.pressure, r.computedHead])}
          />
        </Section>
      )}

      {pipeResults && (
        <Section title="Results — Pipes">
          <Table
            headers={["ID", "Length (m)", "Diameter (mm)", "Flow (LPS)", "Velocity (m/s)", "Headloss (m)"]}
            rows={pipeResults.map((r) => [r.id, r.length, r.diameter, r.flow, r.velocity, r.headloss])}
          />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={styles.th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={styles.td}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles: Record<string, any> = {
  notice: {
    fontSize: 12,
    color: "var(--text-secondary)",
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 16,
  },
  errorBanner: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid var(--danger)",
    color: "var(--danger)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  section: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontWeight: 600, fontSize: 13, marginBottom: 10 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 11,
    color: "var(--text-muted)",
    padding: "4px 6px",
    borderBottom: "1px solid var(--border)",
  },
  td: { padding: "4px 6px", fontSize: 12 },
  input: {
    width: "100%",
    background: "var(--navy-800)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "5px 8px",
    color: "var(--text-primary)",
    fontSize: 12,
  },
  addBtn: {
    background: "transparent",
    border: "1px dashed var(--border)",
    borderRadius: 8,
    padding: "6px 12px",
    color: "var(--teal-400)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "var(--danger)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  runBtn: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 16,
  },
};
