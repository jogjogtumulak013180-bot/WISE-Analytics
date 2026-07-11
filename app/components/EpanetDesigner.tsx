"use client";

import { useRef, useState } from "react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reservoirs, setReservoirs] = useState<Reservoir[]>([{ id: "R1", head: 100 }]);
  const [junctions, setJunctions] = useState<Junction[]>([
    { id: "J1", elevation: 80, demand: 10 },
    { id: "J2", elevation: 60, demand: 15 },
  ]);
  const [pipes, setPipes] = useState<Pipe[]>([
    { id: "P1", from: "R1", to: "J1", length: 500, diameter: 150, roughness: 120 },
    { id: "P2", from: "J1", to: "J2", length: 400, diameter: 100, roughness: 120 },
  ]);

  const [importing, setImporting] = useState(false);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [junctionResults, setJunctionResults] = useState<JunctionResult[] | null>(null);
  const [pipeResults, setPipeResults] = useState<PipeResult[] | null>(null);

  function round(n: number) {
    return Math.round(n * 100) / 100;
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setImporting(true);
    setErrorMsg(null);
    setImportWarning(null);
    setJunctionResults(null);
    setPipeResults(null);

    try {
      const text = await file.text();
      const {
        Workspace,
        Project,
        NodeType,
        LinkType,
        NodeProperty,
        LinkProperty,
        CountType,
      } = await import("epanet-js");

      const ws = new Workspace();
      await ws.loadModule();
      ws.writeFile("imported.inp", text);

      const model = new Project(ws);
      model.open("imported.inp", "report.rpt", "out.bin");

      const nodeCount = model.getCount(CountType.NodeCount);
      const linkCount = model.getCount(CountType.LinkCount);

      const newReservoirs: Reservoir[] = [];
      const newJunctions: Junction[] = [];
      const skipped: string[] = [];

      for (let i = 1; i <= nodeCount; i++) {
        const id = model.getNodeId(i);
        const type = model.getNodeType(i);
        if (type === NodeType.Reservoir) {
          newReservoirs.push({ id, head: round(model.getNodeValue(i, NodeProperty.Elevation)) });
        } else if (type === NodeType.Junction) {
          newJunctions.push({
            id,
            elevation: round(model.getNodeValue(i, NodeProperty.Elevation)),
            demand: round(model.getNodeValue(i, NodeProperty.BaseDemand)),
          });
        } else {
          skipped.push(`Tank "${id}" (approximate with a Reservoir/Junction if needed)`);
        }
      }

      const newPipes: Pipe[] = [];
      for (let i = 1; i <= linkCount; i++) {
        const id = model.getLinkId(i);
        const type = model.getLinkType(i);
        if (type === LinkType.Pipe || type === LinkType.CVPipe) {
          const { node1, node2 } = model.getLinkNodes(i);
          newPipes.push({
            id,
            from: model.getNodeId(node1),
            to: model.getNodeId(node2),
            length: round(model.getLinkValue(i, LinkProperty.Length)),
            diameter: round(model.getLinkValue(i, LinkProperty.Diameter)),
            roughness: round(model.getLinkValue(i, LinkProperty.Roughness)),
          });
        } else {
          skipped.push(`Link "${id}" (pumps/valves aren't supported yet — only plain pipes)`);
        }
      }

      model.close();

      if (newReservoirs.length === 0) {
        throw new Error(
          "No reservoirs found in this file — every network needs at least one fixed-head source."
        );
      }

      setReservoirs(newReservoirs);
      setJunctions(newJunctions);
      setPipes(newPipes);
      setImportedFileName(file.name);
      if (skipped.length > 0) {
        setImportWarning(`Imported, but skipped: ${skipped.join("; ")}.`);
      }
    } catch (err: any) {
      setErrorMsg(`Couldn't import that file: ${err?.message || String(err)}`);
    } finally {
      setImporting(false);
    }
  }

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

      <div style={styles.importBox}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            Designed this network in EPANET already?
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Export it as an <code>.inp</code> file from EPANET Desktop and upload it here —
            it'll fill in the tables below and you can run the same solver on it.
          </div>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".inp"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
          <button
            style={styles.importBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? "Importing…" : "Import .inp file"}
          </button>
        </div>
      </div>

      {importedFileName && !importWarning && !errorMsg && (
        <div style={styles.successBanner}>Imported "{importedFileName}" successfully.</div>
      )}
      {importWarning && <div style={styles.warningBanner}>{importWarning}</div>}
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
    marginBottom: 12,
  },
  importBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    background: "var(--navy-900)",
    border: "1px dashed var(--teal-400)",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 16,
  },
  importBtn: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  successBanner: {
    background: "rgba(52,211,153,0.1)",
    border: "1px solid var(--success)",
    color: "var(--success)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  warningBanner: {
    background: "rgba(251,191,36,0.1)",
    border: "1px solid var(--warning)",
    color: "var(--warning)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
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
