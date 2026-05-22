"use client";

import {
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

type SentimentTimelinePoint = {
  date: string;
  total: number;
};

type SentimentTrendPoint = SentimentTimelinePoint & {
  trendTotal: number;
};

type TooltipPayload = {
  value?: number;
};

function TimelineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg shadow-slate-200/70">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-slate-500">
        <span className="font-semibold text-indigo-600">
          {(payload[0].value ?? 0).toFixed(1)}
        </span>{" "}
        review trend score
      </p>
    </div>
  );
}

export default function ChartSection({
  data,
}: {
  data: SentimentTimelinePoint[];
}) {
  const totalReviews = data.reduce((total, item) => total + item.total, 0);
  const peakPoint = data.reduce<SentimentTimelinePoint | null>((peak, item) => {
    if (!peak || item.total > peak.total) return item;
    return peak;
  }, null);
  const trendData = data.map<SentimentTrendPoint>((item, index) => {
    const windowStart = Math.max(0, index - 6);
    const window = data.slice(windowStart, index + 1);
    const trendTotal =
      window.reduce((total, point) => total + point.total, 0) / window.length;

    return {
      ...item,
      trendTotal: Number(trendTotal.toFixed(2)),
    };
  });

  return (
    <Card
      className="h-full rounded-3xl border-slate-100 bg-white py-0 shadow-sm shadow-slate-200/70"
      style={{
        minHeight: 420,
        borderRadius: 24,
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent className="flex h-full flex-col p-6" style={{ padding: 28 }}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-950">
              Sentiment Timeline
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Clean trend view of review activity over time.
            </p>
          </div>

          <div className="hidden gap-2 sm:flex">
            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {totalReviews.toLocaleString()} reviews
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
              Peak {peakPoint?.total ?? 0}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1" style={{ minHeight: 310 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trendData}
              margin={{ top: 18, right: 14, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sentimentTimelineFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#e5e7eb"
                strokeDasharray="4 8"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={42}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={[0, 3]}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                width={38}
              />
              <Tooltip content={<TimelineTooltip />} cursor={{ stroke: "#c7d2fe" }} />
              <Area
                type="monotone"
                dataKey="trendTotal"
                fill="url(#sentimentTimelineFill)"
                stroke="transparent"
              />
              <Line
                type="monotone"
                dataKey="trendTotal"
                name="Review trend"
                stroke="#4f46e5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  fill: "#4f46e5",
                  r: 5,
                  stroke: "#ffffff",
                  strokeWidth: 3,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
