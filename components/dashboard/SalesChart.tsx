"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import SalesChartSkeleton from "@/components/dashboard/skeleton/SalesChartSkeleton";

type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
  upper?: number | null;
  lower?: number | null;
};

// Membuat tipe data kustom eksplisit untuk menghindari error mismatch Recharts
type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | null;
    color: string;
  }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#1e293b] border border-border rounded-xl p-3 text-xs shadow-xl shadow-black/20">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p) => {
        if (p.value === null || p.value === undefined) return null;
        return (
          <div key={p.name} className="flex items-center gap-2 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-slate-400">{p.name}:</span>
            <span className="font-bold text-white">
              {Math.round(p.value).toLocaleString("id-ID")} unit
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function SalesChart({
  data,
  modelUsed,
  loading,
}: {
  data: ForecastPoint[];
  modelUsed?: string;
  loading?: boolean;
}) {
  if (loading) return <SalesChartSkeleton />;
  if (!data || data.length === 0) return null;

  const isMVA = modelUsed === "moving_average";

  const lastActualIndex = data.reduce(
    (last, d, i) => (d.actual != null ? i : last),
    -1,
  );

  const chartData = data.map((d, i) => ({
    date: d.date,
    actual: d.actual ?? null,
    predicted: i >= lastActualIndex ? (d.predicted ?? d.actual ?? null) : null,
    upper: d.upper ?? null,
    lower: d.lower ?? null,
  }));

  const allValues = data
    .flatMap((d) => [d.actual, d.predicted, d.upper, d.lower])
    .filter((v): v is number => typeof v === "number");
  const maxVal = Math.max(...allValues, 0);

  return (
    <div className="glass-card border border-border p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-bold text-white">
            Penjualan Aktual vs Prediksi
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Tren penjualan historis dan proyeksi ke depan
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-[#F59E0B] rounded-full" />
            <span className="text-xs text-slate-400">Aktual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-[#009B77] border-t-2 border-dashed border-[#009B77] rounded-none" />
            <span className="text-xs text-slate-400">
              {isMVA ? "Estimasi (MVA)" : "Prediksi"}
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <CartesianGrid
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 8"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            domain={[0, maxVal > 0 ? Math.ceil(maxVal * 1.2) : 10]}
            width={36}
          />

          <Tooltip content={<CustomTooltip />} />

          {lastActualIndex >= 0 && chartData[lastActualIndex] && (
            <ReferenceLine
              x={chartData[lastActualIndex].date}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 4"
              label={{
                value: "Hari ini",
                position: "top",
                fontSize: 10,
                fill: "#64748b",
              }}
            />
          )}

          {/* Menggunakan fungsi callback pada dataKey agar lolos pengecekan tipe TypeScript */}
          {isMVA && (
            <Area
              type="monotone"
              dataKey={(d: any) => [d.lower, d.upper]}
              name="Rentang Estimasi"
              stroke="none"
              fill="rgba(0,155,119,0.12)"
              fillOpacity={1}
              connectNulls={true}
            />
          )}

          <Line
            type="monotone"
            dataKey="actual"
            name="Aktual"
            stroke="#F59E0B"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            activeDot={{
              r: 5,
              fill: "#F59E0B",
              stroke: "#0f172a",
              strokeWidth: 2,
            }}
          />

          <Line
            type={isMVA ? "stepAfter" : "monotone"}
            dataKey="predicted"
            name={isMVA ? "Estimasi" : "Prediksi"}
            stroke="#009B77"
            strokeWidth={2.5}
            strokeDasharray={isMVA ? "none" : "6 4"}
            dot={false}
            connectNulls={false}
            activeDot={{
              r: 5,
              fill: "#009B77",
              stroke: "#0f172a",
              strokeWidth: 2,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-[#1e293b]/50">
        <div className="w-1.5 h-1.5 rounded-full bg-[#009B77]" />
        <p className="text-xs text-slate-400">
          {isMVA
            ? "Estimasi menggunakan rata-rata tertimbang (Moving Average) dari data terbatas."
            : `Prediksi menggunakan ${modelUsed ? modelUsed.replace(/_/g, " ") : "Prophet"} berdasarkan data historis penjualan.`}
        </p>
      </div>
    </div>
  );
}
