"use client";

import {
  ComposedChart,
  Line,
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
};

type TooltipProps = {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
};

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <p style={{ fontWeight: 500, color: "#111827", marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color,
            }}
          />
          <span style={{ color: "#6b7280" }}>{p.name}:</span>
          <span style={{ fontWeight: 500, color: "#111827" }}>
            {p.value} unit
          </span>
        </div>
      ))}
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
  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return <SalesChartSkeleton />;
  }

  // ── EMPTY — sembunyikan komponen sepenuhnya ─────────────────────────────
  if (!data || data.length === 0) {
    return null;
  }

  // ── DATA ADA — render normal ────────────────────────────────────────────
  const lastActualIndex = data.reduce(
    (last, d, i) => (d.actual != null ? i : last),
    -1,
  );

  const chartData = data.map((d, i) => ({
    date: d.date,
    actual: d.actual ?? null,
    predicted: i >= lastActualIndex ? (d.predicted ?? null) : null,
  }));

  const allValues = data
    .flatMap((d) => [d.actual, d.predicted])
    .filter(Boolean) as number[];
  const maxVal = Math.max(...allValues, 0);

  return (
    <div
      className="min-w-0 px-4 py-5 sm:px-6"
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
      }}
    >
      <div
        className="flex-col gap-3 sm:flex-row sm:items-start"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>
            Penjualan Aktual vs Prediksi
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
            Tren penjualan historis dan proyeksi 7 hari ke depan
          </p>
        </div>

        <div
          className="flex-wrap"
          style={{ display: "flex", gap: 16, alignItems: "center" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 3,
                background: "#4f46e5",
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Aktual</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 3,
                background: "#1D9E75",
                borderRadius: 2,
                borderTop: "2px dashed #1D9E75",
                backgroundColor: "transparent",
              }}
            />
            <span style={{ fontSize: 11, color: "#6b7280" }}>Prediksi</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#f3f4f6"
            strokeDasharray="4 8"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            domain={[0, Math.ceil(maxVal * 1.2)]}
            width={36}
          />

          <Tooltip content={<CustomTooltip />} />

          {lastActualIndex >= 0 && (
            <ReferenceLine
              x={chartData[lastActualIndex]?.date}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              label={{
                value: "Hari ini",
                position: "top",
                fontSize: 10,
                fill: "#9ca3af",
              }}
            />
          )}

          <Line
            type="monotone"
            dataKey="actual"
            name="Aktual"
            stroke="#4f46e5"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            activeDot={{
              r: 5,
              fill: "#4f46e5",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />

          <Line
            type="monotone"
            dataKey="predicted"
            name="Prediksi"
            stroke="#1D9E75"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls={false}
            activeDot={{
              r: 5,
              fill: "#1D9E75",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div
        className="items-start sm:items-center"
        style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "#f9fafb",
          borderRadius: 8,
          display: "flex",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#1D9E75",
          }}
        />
        <p style={{ fontSize: 11, color: "#6b7280" }}>
          Prediksi menggunakan{" "}
          {modelUsed ? modelUsed.replace(/_/g, " ") : "Linear Regression"}
          {""}berdasarkan data historis penjualan
        </p>
      </div>
    </div>
  );
}
