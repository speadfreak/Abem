"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatETB } from "@/lib/format";

const GOLD = "#e8a317";
const GRID = "rgba(232, 163, 23, 0.08)";
const AXIS = { fill: "#a7937a", fontSize: 11 };

const TOOLTIP = {
  contentStyle: {
    background: "#1a110b",
    border: "1px solid rgba(232, 163, 23, 0.35)",
    borderRadius: 12,
    fontSize: 12,
    color: "#f4e9d8",
  },
  labelStyle: { color: GOLD, fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "#f4e9d8" },
  cursor: { stroke: "rgba(232, 163, 23, 0.25)" },
} as const;

function dayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

export function OrdersLineChart({ data }: { data: { date: string; orders: number; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={dayLabel} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...TOOLTIP} />
        <Line
          type="monotone"
          dataKey="orders"
          name="Orders"
          stroke={GOLD}
          strokeWidth={2.4}
          dot={{ r: 3, fill: GOLD, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueBarChart({ data }: { data: { date: string; orders: number; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={dayLabel} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
        />
        <Tooltip {...TOOLTIP} formatter={(v) => [formatETB(Number(v)), "Revenue"]} />
        <Bar dataKey="revenue" name="Revenue" fill="rgba(232, 163, 23, 0.75)" radius={[4, 4, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}
