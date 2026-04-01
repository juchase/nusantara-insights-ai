"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChartSection({ data }: { data: any[] }) {
  return (
    <Card className="rounded-2xl border-none shadow-sm bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-slate-800">
          Sentiment Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              {/* Garis bantu horizontal saja supaya clean */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                dy={10}
                // SOLUSI TANGGAL BERTUMPUK:
                minTickGap={30}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: "20px", fontSize: "12px" }}
              />

              {/* Garis Positive - Hijau */}
              <Line
                type="monotone" // Membuat garis melengkung halus
                dataKey="positive"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false} // Menghilangkan titik supaya tidak penuh sesak
                activeDot={{ r: 6, strokeWidth: 0 }}
              />

              {/* Garis Neutral - Abu-abu */}
              <Line
                type="monotone"
                dataKey="neutral"
                stroke="#94a3b8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />

              {/* Garis Negative - Merah */}
              <Line
                type="monotone"
                dataKey="negative"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
