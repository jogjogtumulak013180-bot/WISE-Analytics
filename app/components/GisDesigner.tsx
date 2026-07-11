"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { supabase, type GisFeature, type GisNodeType } from "../lib/supabase";

type Mode = "view" | GisNodeType | "pipe";

const NODE_COLORS: Record<GisNodeType, string> = {
  Junction: "#9fb0c9",
  Reservoir: "#22d3ee",
  Tank: "#34d399",
  Pump: "#f59e0b",
};

const NODE_TYPES: GisNodeType[] = ["Junction", "Reservoir", "Tank", "Pump"];

interface PendingNode {
  nodeType: GisNodeType;
  lat: number;
  lng: number;
}

export default function GisDesigner() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const linesRef = useRef<Map<string, any>>(new Map());
  const pendingNodeForPipeRef = useRef<GisFeature | null>(null);

  const [mode, setMode] = useState<Mode>("view");
  const [features, setFeatures] = useState<GisFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pendingNode, setPendingNode] = useState<PendingNode | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const modeRef = useRef<Mode>("view");
  const featuresRef = useRef<GisFeature[]>([]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), 3000);
    return () => clearTimeout(t);
  }, [hint]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapContainerRef.current) return;
      leafletRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapContainerRef.current).setView([12.8797, 121.774], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e: any) => handleMapClick(e.latlng, L, map));
      mapRef.current = map;

      await loadFeatures(L, map);
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFeatures(L: any, map: any) {
    setLoading(true);
    const { data, error } = await supabase
      .from("wa_gis_features")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    const rows = (data as GisFeature[]) ?? [];
    setFeatures(rows);
    rows.forEach((f) => renderFeature(f, L, map));
    setLoading(false);
  }

  function renderFeature(f: GisFeature, L: any, map: any) {
    if (f.feature_type === "node") {
      const color = NODE_COLORS[f.node_type as GisNodeType] ?? "#9fb0c9";
      const marker = L.circleMarker([f.geometry.lat, f.geometry.lng], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      })
        .addTo(map)
        .bindTooltip(`${f.label} (${f.node_type})`);
      markersRef.current.set(f.id, marker);
    } else {
      const line = L.polyline(
        [
          [f.geometry.from[0], f.geometry.from[1]],
          [f.geometry.to[0], f.geometry.to[1]],
        ],
        { color: "#e8edf5", weight: 3, opacity: 0.8 }
      )
        .addTo(map)
        .bindTooltip(f.label);
      linesRef.current.set(f.id, line);
    }
  }

  function handleMapClick(latlng: { lat: number; lng: number }, L: any, map: any) {
    const currentMode = modeRef.current;
    if (currentMode === "view") return;

    if (currentMode === "pipe") {
      const nearest = findNearestNode(latlng);
      if (!nearest) {
        setHint("Click near an existing node to start/end a pipe.");
        return;
      }
      if (!pendingNodeForPipeRef.current) {
        pendingNodeForPipeRef.current = nearest;
        setHint(`Selected "${nearest.label}" — click another node to connect it to.`);
        return;
      }
      const from = pendingNodeForPipeRef.current;
      const to = nearest;
      pendingNodeForPipeRef.current = null;
      if (from.id === to.id) return;
      createPipe(from, to, L, map);
      return;
    }

    // Node placement mode — open the in-app label modal instead of a blocking prompt().
    setPendingNode({ nodeType: currentMode as GisNodeType, lat: latlng.lat, lng: latlng.lng });
    setLabelInput(currentMode as string);
  }

  async function createPipe(from: GisFeature, to: GisFeature, L: any, map: any) {
    const label = `${from.label} → ${to.label}`;
    const { data, error } = await supabase
      .from("wa_gis_features")
      .insert({
        feature_type: "pipe",
        node_type: null,
        label,
        geometry: {
          from: [from.geometry.lat, from.geometry.lng],
          to: [to.geometry.lat, to.geometry.lng],
        },
        properties: { fromId: from.id, toId: to.id },
      })
      .select()
      .single();
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    const feature = data as GisFeature;
    setFeatures((prev) => [...prev, feature]);
    renderFeature(feature, L, map);
  }

  async function confirmPendingNode() {
    if (!pendingNode) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const label = labelInput.trim() || pendingNode.nodeType;

    const { data, error } = await supabase
      .from("wa_gis_features")
      .insert({
        feature_type: "node",
        node_type: pendingNode.nodeType,
        label,
        geometry: { lat: pendingNode.lat, lng: pendingNode.lng },
        properties: {},
      })
      .select()
      .single();

    setPendingNode(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    const feature = data as GisFeature;
    setFeatures((prev) => [...prev, feature]);
    renderFeature(feature, L, map);
  }

  function findNearestNode(latlng: { lat: number; lng: number }): GisFeature | null {
    const nodes = featuresRef.current.filter((f) => f.feature_type === "node");
    let best: GisFeature | null = null;
    let bestDist = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.geometry.lat - latlng.lat, n.geometry.lng - latlng.lng);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    return bestDist < 2 ? best : null; // generous threshold, degrees
  }

  async function handleDelete(f: GisFeature) {
    const { error } = await supabase.from("wa_gis_features").delete().eq("id", f.id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    if (f.feature_type === "node") {
      markersRef.current.get(f.id)?.remove();
      markersRef.current.delete(f.id);
    } else {
      linesRef.current.get(f.id)?.remove();
      linesRef.current.delete(f.id);
    }
    setFeatures((prev) => prev.filter((x) => x.id !== f.id));
  }

  return (
    <div>
      <div style={styles.toolbar}>
        {NODE_TYPES.map((nt) => (
          <button
            key={nt}
            onClick={() => setMode(mode === nt ? "view" : nt)}
            style={{
              ...styles.toolBtn,
              ...(mode === nt ? styles.toolBtnActive(NODE_COLORS[nt]) : {}),
            }}
          >
            {"●"} {nt}
          </button>
        ))}
        <button
          onClick={() => setMode(mode === "pipe" ? "view" : "pipe")}
          style={{
            ...styles.toolBtn,
            ...(mode === "pipe" ? styles.toolBtnActive("#e8edf5") : {}),
          }}
        >
          {"—"} Pipe
        </button>
        <div style={styles.modeHint}>
          {hint
            ? hint
            : mode === "view"
            ? "Select a tool, then click the map to place it."
            : NODE_TYPES.includes(mode as GisNodeType)
            ? `Click the map to place a ${mode}.`
            : "Click two existing nodes to connect them with a pipe."}
        </div>
      </div>

      {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

      <div ref={mapContainerRef} style={styles.map} />

      <div style={styles.legendPanel}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
          Network Features {loading ? "(loading…)" : `(${features.length})`}
        </div>
        {features.length === 0 && !loading && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            No features yet — use the tools above to start designing the network.
          </div>
        )}
        <div style={styles.legendList}>
          {features.map((f) => (
            <div key={f.id} style={styles.legendRow}>
              <span style={{ fontSize: 12 }}>
                {f.feature_type === "node" ? "●" : "—"} {f.label}
                {f.node_type ? ` (${f.node_type})` : ""}
              </span>
              <button style={styles.deleteBtn} onClick={() => handleDelete(f)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {pendingNode && (
        <div style={styles.modalOverlay} onClick={() => setPendingNode(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
              Label this {pendingNode.nodeType}
            </div>
            <input
              autoFocus
              style={styles.modalInput}
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmPendingNode();
                if (e.key === "Escape") setPendingNode(null);
              }}
            />
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setPendingNode(null)}>
                Cancel
              </button>
              <button style={styles.primaryBtn} onClick={confirmPendingNode}>
                Place {pendingNode.nodeType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, any> = {
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  toolBtn: {
    background: "var(--navy-800)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "var(--text-secondary)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  toolBtnActive: (accent: string) => ({
    borderColor: accent,
    color: "var(--text-primary)",
    background: "var(--navy-700)",
  }),
  modeHint: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginLeft: 8,
  },
  errorBanner: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid var(--danger)",
    color: "var(--danger)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 12,
  },
  map: {
    width: "100%",
    height: 440,
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--navy-900)",
  },
  legendPanel: {
    marginTop: 14,
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 16,
  },
  legendList: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" },
  legendRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border)",
    paddingBottom: 6,
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "var(--danger)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5,10,20,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 50,
  },
  modal: {
    background: "var(--navy-900)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 24,
    width: "100%",
    maxWidth: 380,
  },
  modalInput: {
    width: "100%",
    background: "var(--navy-800)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "9px 12px",
    color: "var(--text-primary)",
    fontSize: 13,
    marginBottom: 16,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  secondaryBtn: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, var(--teal-500), var(--cyan-400))",
    color: "var(--navy-950)",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
};
