"use client";

import { InsightResponse } from "@/types/insight";
import { Check, Minus, TrendingDown, TrendingUp, X, Info } from "lucide-react";
import RiskOverviewSkeleton from "@/components/dashboard/skeleton/RiskOverviewSkeleton";

interface Props {
  insight: InsightResponse | null;
  loading: boolean;
}

const RISK_STYLE: Record<string, { className: string; label: string }> = {
  high: { className: "bg-danger/15 text-danger", label: "Tinggi" },
  medium: { className: "bg-primary/15 text-primary", label: "Sedang" },
  low: { className: "bg-secondary/15 text-secondary", label: "Rendah" },
  unknown: { className: "bg-card text-muted", label: "—" },
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
      tooltip:
        "Tingkat urgensi penanganan produk berdasarkan kalkulasi keparahan komplain dan tren penurunan sentimen.",
      value: (
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${risk.className}`}
        >
          {risk.label}
        </span>
      ),
    },
    {
      label: "Isu Dominan",
      tooltip:
        "Topik masalah utama yang paling banyak dikeluhkan oleh konsumen dalam ulasan negatif terakhir.",
      value: (
        <span className="text-sm font-medium text-foreground capitalize">
          {insight.dominant_issue ?? "—"}
        </span>
      ),
    },
    {
      label: "Demand Trend",
      tooltip:
        "Arah pergerakan permintaan volume penjualan di masa mendatang yang diproyeksikan oleh model AI.",
      value:
        trend === "up" ? (
          <span className="text-xs font-bold text-secondary flex items-center gap-1">
            <TrendingUp size={14} /> Meningkat
          </span>
        ) : trend === "down" ? (
          <span className="text-xs font-bold text-danger flex items-center gap-1">
            <TrendingDown size={14} /> Menurun
          </span>
        ) : (
          <span className="text-xs font-bold text-muted flex items-center gap-1">
            <Minus size={14} /> Stabil
          </span>
        ),
    },
    {
      label: "LLM Digunakan",
      tooltip:
        "Status pemrosesan wawasan teks ulasan menggunakan model bahasa besar (Generative AI) berbasis Qwen.",
      value: llmUsed ? (
        <span className="text-xs font-bold text-tertiary flex items-center gap-1">
          <Check size={14} /> Ya (Qwen2.5)
        </span>
      ) : (
        <span className="text-xs font-medium text-muted flex items-center gap-1">
          <X size={14} /> Tidak (Fallback)
        </span>
      ),
    },
  ];

  return (
    <div className="glass-card border border-border p-5">
      <p className="text-sm font-bold text-foreground mb-1">Risk Overview</p>
      <p className="text-xs text-muted mb-3">Status keseluruhan produk</p>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-card/50 rounded-lg p-3 group cursor-help relative"
          >
            {/* Label dengan Ikon Info */}
            <span className="text-xs text-muted flex items-center gap-1.5 select-none">
              {row.label}
              <Info
                size={12}
                className="text-muted/60 group-hover:text-muted transition-colors"
              />
            </span>

            {/* Nilai Metrik */}
            {row.value}

            {/* Tooltip Content Popover */}
            <div className="absolute bottom-[85%] left-3 mb-1 w-60 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 pointer-events-none">
              <p className="text-[10px] text-muted font-normal leading-relaxed">
                {row.tooltip}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
