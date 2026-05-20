"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SalesLineChartProps {
  data: { date: string; revenue: number }[];
  height?: number;
}

function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
}

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="text-brand-muted text-xs mb-1">{label ? formatShortDate(label) : ""}</p>
      <p className="text-white font-bold">Bs. {payload[0].value.toFixed(2)}</p>
    </div>
  );
}

export function SalesLineChart({ data, height = 260 }: SalesLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-brand-muted text-sm" style={{ height }}>
        Sin datos para este periodo.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fill: "#8b8fa8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#8b8fa8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `Bs.${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#ff6b00"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#ff6b00" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
