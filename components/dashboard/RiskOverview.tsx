"use client";

import { InsightResponse } from "@/types/insight";
import { Check, Minus, TrendingDown, TrendingUp, X } from "lucide-react";
import RiskOverviewSkeleton from "@/components/dashboard/skeleton/RiskOverviewSkeleton";

interface Props {
  insight: InsightResponse | null;
  loading: boolean;
}

const RISK_STYLE: Record<string, { bg: string; color: string; label: string }> =
  {
    high: { bg: "bg-[#E24B4A]/15", color: "text-[#E24B4A]", label: "Tinggi" },
    medium: { bg: "bg-[#F59E0B]/15", color: "text-[#F59E0B]", label: "Sedang" },
    low: { bg: "bg-[#009B77]/15", color: "text-[#009B77]", label: "Rendah" },
    unknown: { bg: "bg-[#1e293b]", color: "text-slate-400", label: "—" },
  };

export default function RiskOverview({ insight, loading }: Props) {
  if (loading) return <RiskOverviewSkeleton />;
  if (!insight) return null;

  const risk = RISK_STYLE[insight.risk_level ?? "low"];
  const trend = insight.metrics?.forecast_trend ?? "stable";
  const llmUsed = insight.llm_used;

  const rows = [
    {
      label: "Risk Level",
      value: (
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${risk.bg} ${risk.color}`}
        >
          {risk.label}
        </span>
      ),
    },
    {
      label: "Isu Dominan",
      value: (
        <span className="text-sm font-medium text-white capitalize">
          {insight.dominant_issue ?? "—"}
        </span>
      ),
    },
    {
      label: "Demand Trend",
      value:
        trend === "up" ? (
          <span className="text-xs font-bold text-[#009B77] flex items-center gap-1">
            <TrendingUp size={14} /> Meningkat
          </span>
        ) : trend === "down" ? (
          <span className="text-xs font-bold text-[#E24B4A] flex items-center gap-1">
            <TrendingDown size={14} /> Menurun
          </span>
        ) : (
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Minus size={14} /> Stabil
          </span>
        ),
    },
    {
      label: "LLM Digunakan",
      value: llmUsed ? (
        <span className="text-xs font-bold text-[#7F77DD] flex items-center gap-1">
          <Check size={14} /> Ya (Qwen2.5)
        </span>
      ) : (
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
          <X size={14} /> Tidak (Fallback)
        </span>
      ),
    },
  ];

  return (
    <div className="glass-card border border-border p-5">
      <p className="text-sm font-bold text-white mb-1">Risk Overview</p>
      <p className="text-xs text-slate-400 mb-3">Status keseluruhan produk</p>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-[#1e293b]/50 rounded-lg p-3"
          >
            <span className="text-xs text-slate-400">{row.label}</span>
            {row.value}
          </div>
        ))}
      </div>
    </div>
  );
}
