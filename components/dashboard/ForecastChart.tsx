"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function getDemandAlert(growth: number) {
  if (growth > 20) return "High demand increase expected";
  if (growth > 10) return "Moderate growth expected";
  if (growth < -10) return "Demand may decrease";
  return "Stable demand predicted";
}

export default function ForecastChart({
  data,
  growth,
}: {
  data: any[];
  growth: number;
}) {
  return (
    <div className="bg-indigo-600 text-white p-6 rounded-2xl space-y-4">
      <h2 className="text-lg font-semibold">Demand Forecast</h2>

      {/* Growth */}
      <div>
        <p className="text-sm opacity-80">Predicted growth</p>
        <h1 className="text-3xl font-bold">+{growth}%</h1>
        <p className="text-sm">{getDemandAlert(growth)}</p>
      </div>

      {/* Chart */}
      <LineChart width={400} height={200} data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" />
        <XAxis dataKey="date" stroke="#fff" />
        <YAxis stroke="#fff" />
        <Tooltip />

        {/* actual */}
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#ffffff"
          strokeWidth={2}
        />

        {/* predicted */}
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#ffffff"
          strokeDasharray="5 5"
          strokeWidth={2}
        />
      </LineChart>

      <p className="text-xs opacity-70">
        Based on historical sales trend using Linear Regression
      </p>
    </div>
  );
}
