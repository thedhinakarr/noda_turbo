"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// Dynamically load the Leaflet map to avoid SSR issues
const Map = dynamic(() => import("./components/Map"), { ssr: false });

/* --------------------------------- types --------------------------------- */
interface RawRow {
  [key: string]: string;
}

export interface EngineerRow {
  date: string;
  building: string;
  energy: number;
  volume: number;
  demand: number;
  efficiency: number;
  lat: number;
  lng: number;
}

interface EconomistRow {
  date: string;
  building: string;
  cost: number;
  co2: number;
}

/* ------------------------------- constants ------------------------------- */
const ENERGY_PRICE = 0.12; // €/kWh
const CO2_FACTOR = 0.19; // kg/kWh

/* -------------------------------- helpers -------------------------------- */
const num = (v?: string) => {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};

const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 1 });

const effColor = (e: number) =>
  e > 0.9 ? "text-green-600" : e > 0.7 ? "text-yellow-600" : "text-red-600";

/* ------------------------------- component ------------------------------- */
export default function Dashboard() {
  const [raw, setRaw] = useState<RawRow[]>([]);
  const [tab, setTab] = useState<"engineer" | "economist">("engineer");
  const [loading, setLoading] = useState(true);

  /* fetch data once */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/retrospect");
        const json = (await res.json()) as RawRow[];
        setRaw(json);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* parse */
  const engineerData: EngineerRow[] = useMemo(
    () =>
      raw.map((r) => ({
        date: r["Time period"] ?? "",
        building: r["Building (control)"] ?? "—",
        energy: num(r["Energy (abs)"] ?? (r as any).energy ?? (r as any).energy_abs),
        volume: num(r["Volume (abs)"] ?? (r as any).volume ?? (r as any).volume_abs),
        demand: num(r["Demand (k)"] ?? (r as any).demand ?? (r as any).demand_k),
        efficiency: num(r["Efficiency"] ?? (r as any).efficiency),
        lat: num((r as any).lat),
        lng: num((r as any).lng),
      })),
    [raw]
  );

  const economistData: EconomistRow[] = useMemo(
    () =>
      engineerData.map((e) => ({
        date: e.date,
        building: e.building,
        cost: e.energy * ENERGY_PRICE,
        co2: e.energy * CO2_FACTOR,
      })),
    [engineerData]
  );

  if (loading) return <div className="p-10 text-center">Loading…</div>;

  /* charts */
  const engineerChart = (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={engineerData} margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="energy" stroke="#3b82f6" dot={false} name="Energy (kWh)" />
        <Line type="monotone" dataKey="volume" stroke="#10b981" dot={false} name="Volume (m³)" />
        <Line type="monotone" dataKey="demand" stroke="#f59e0b" dot={false} name="Demand (kW)" />
      </LineChart>
    </ResponsiveContainer>
  );

  const economistChart = (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={top10(economistData)} margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="building" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="cost" fill="#0ea5e9" name="Cost (€)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const rows = tab === "engineer" ? engineerData : economistData;

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-3">
        {(["engineer", "economist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-md border text-sm font-medium ${
              tab === t ? "bg-blue-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            {t === "engineer" ? "Engineer" : "Economist"}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {engineerData.length === 0 ? (
        <p className="text-center text-gray-500">No data available yet.</p>
      ) : (
        <>
      {tab === "engineer" ? engineerChart : economistChart}

      {/* Table */}
      <div className="overflow-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Building</th>
              {tab === "engineer" ? (
                <>
                  <th className="p-2 text-right">Energy</th>
                  <th className="p-2 text-right">Volume</th>
                  <th className="p-2 text-right">Demand</th>
                  <th className="p-2 text-right">Eff.</th>
                </>
              ) : (
                <>
                  <th className="p-2 text-right">Cost (€)</th>
                  <th className="p-2 text-right">CO₂ (kg)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((r) => (
              <tr key={`${r.building}-${r.date}`} className="odd:bg-gray-50">
                <td className="p-2 whitespace-nowrap">{r.building}</td>
                {tab === "engineer" ? (
                  <EngineerCells row={r as EngineerRow} />
                ) : (
                  <EconomistCells row={r as EconomistRow} />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </>
      )}

      {/* Map */}
      <div className="h-80 w-full">
        <Map points={engineerData} />
      </div>
    </div>
  );
}

/* cell helpers */
const EngineerCells = ({ row }: { row: EngineerRow }) => (
  <>
    <td className="p-2 text-right">{fmt(row.energy)}</td>
    <td className="p-2 text-right">{fmt(row.volume)}</td>
    <td className="p-2 text-right">{fmt(row.demand)}</td>
    <td className={`p-2 text-right ${effColor(row.efficiency)}`}>{fmt(row.efficiency)}</td>
  </>
);

const EconomistCells = ({ row }: { row: EconomistRow }) => (
  <>
    <td className="p-2 text-right">{fmt(row.cost)}</td>
    <td className="p-2 text-right">{fmt(row.co2)}</td>
  </>
);

/* utils */
function top10(arr: EconomistRow[]) {
  return [...arr].sort((a, b) => b.cost - a.cost).slice(0, 10);
}
