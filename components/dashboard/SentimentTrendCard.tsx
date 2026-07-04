"use client";

import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { SentimentTrend } from "@/types/insight";
import SentimentTrendCardSkeleton from "@/components/dashboard/skeleton/SentimentTrendCardSkeleton";

const TREND_CONFIG = {
  improving: {
    color: "text-[#009B77]",
    bg: "bg-[#009B77]/15",
    icon: <TrendingUp size={14} />,
    arrow: "↑",
  },
  declining: {
    color: "text-[#E24B4A]",
    bg: "bg-[#E24B4A]/15",
    icon: <TrendingDown size={14} />,
    arrow: "↓",
  },
  stable: {
    color: "text-[#64748b]",
    bg: "bg-[#64748b]/15",
    icon: <Minus size={14} />,
    arrow: "→",
  },
  insufficient_data: {
    color: "text-slate-500",
    bg: "bg-[#1e293b]",
    icon: <Info size={14} />,
    arrow: "—",
  },
};

export default function SentimentTrendCard({
  data,
  loading,
}: {
  data?: SentimentTrend;
  loading?: boolean;
}) {
  if (loading) return <SentimentTrendCardSkeleton />;
  if (!data) return null;

  const dataStatus = data.status?.toLowerCase();
  if (dataStatus === "insufficient_data" || dataStatus !== "ok") {
    return (
      <div className="glass-card border border-border p-5">
        <p className="text-sm font-bold text-white mb-1">Tren Sentimen</p>
        <p className="text-xs text-slate-400">
          {data.message ?? "Belum ada data tren"}
        </p>
      </div>
    );
  }

  const cfg = TREND_CONFIG[data.trend] ?? TREND_CONFIG.stable;
  const delta = data.delta > 0 ? `+${data.delta}%` : `${data.delta}%`;

  return (
    <div className="glass-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-white">Tren Sentimen</p>
          <p className="text-xs text-slate-400 mt-1">
            Periode awal vs periode akhir
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
        >
          {cfg.icon}
          {data.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-[#1e293b] rounded-lg p-3 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Periode Awal
          </p>
          <p className="text-xl font-bold text-white">
            {data.first_period_positive}%
          </p>
          <p className="text-[9px] text-slate-500 mt-1 wrap-break-word">
            {data.first_period_range}
          </p>
          <p className="text-[9px] text-slate-500">
            {data.first_period_count} ulasan
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 w-10 shrink-0">
          <span
            className="text-lg font-bold"
            style={{
              color: cfg.color.split("-")[1]
                ? `#${cfg.color.split("-")[1]}`
                : "#64748b",
            }}
          >
            {cfg.arrow}
          </span>
          <span className={`text-[10px] font-bold ${cfg.color}`}>{delta}</span>
        </div>

        <div className="flex-1 bg-[#1e293b] rounded-lg p-3 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Periode Akhir
          </p>
          <p
            className="text-xl font-bold"
            style={{
              color: cfg.color.split("-")[1]
                ? `#${cfg.color.split("-")[1]}`
                : "#64748b",
            }}
          >
            {data.second_period_positive}%
          </p>
          <p className="text-[9px] text-slate-500 mt-1 wrap-break-word">
            {data.second_period_range}
          </p>
          <p className="text-[9px] text-slate-500">
            {data.second_period_count} ulasan
          </p>
        </div>
      </div>

      <div className={`flex items-center gap-2 rounded-lg p-2.5 ${cfg.bg}`}>
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: cfg.color.split("-")[1]
              ? `#${cfg.color.split("-")[1]}`
              : "#64748b",
          }}
        />
        <p className={`text-xs font-medium ${cfg.color}`}>{data.message}</p>
      </div>
    </div>
  );
}
