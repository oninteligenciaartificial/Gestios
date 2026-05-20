"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface CategoryBarChartProps {
  data: { name: string; value: number }[];
  height?: number;
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
      <p className="text-brand-muted text-xs mb-1">{label}</p>
      <p className="text-white font-bold">Bs. {payload[0].value.toFixed(2)}</p>
    </div>
  );
}

export function CategoryBarChart({ data, height = 220 }: CategoryBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-brand-muted text-sm" style={{ height }}>
        Sin datos para este periodo.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: "#8b8fa8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8b8fa8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `Bs.${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#ff6b00" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
