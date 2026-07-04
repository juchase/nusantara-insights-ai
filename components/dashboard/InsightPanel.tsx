"use client";

import { InsightResponse } from "@/types/insight";
import InsightPanelSkeleton from "@/components/dashboard/skeleton/InsightPanelSkeleton";

interface Props {
  insight: InsightResponse | null;
  totalReviews?: number;
  avgRating?: number;
  totalProducts?: number;
  loading: boolean;
}

// Warna sesuai palet Obsidian: Zamrud, Emas, Indigo, Merah
const DOT_COLOR: Record<string, string> = {
  warning: "#F59E0B", // Emas
  positive: "#009B77", // Zamrud
  danger: "#E24B4A", // Merah
  opportunity: "#7F77DD", // Indigo Sistem
  neutral: "#64748b", // Slate
};

const PRIORITY_STYLE: Record<string, { background: string; color: string }> = {
  HIGH: { background: "bg-[#E24B4A]/15", color: "text-[#E24B4A]" },
  MEDIUM: { background: "bg-[#F59E0B]/15", color: "text-[#F59E0B]" },
  LOW: { background: "bg-[#009B77]/15", color: "text-[#009B77]" },
};

export default function InsightPanel({ insight, loading }: Props) {
  // ── LOADING ──────────────────────────────────────────────
  if (loading) {
    return <InsightPanelSkeleton />;
  }

  // ── EMPTY ──────────────────────────────────────────────
  if (
    !insight ||
    (insight.insights.length === 0 && insight.recommendations.length === 0)
  ) {
    return null;
  }

  // ── DATA ADA ────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Insights */}
      <div className="glass-card border border-border p-5">
        <p className="text-sm font-bold text-white mb-1">AI Insight Bisnis</p>
        <p className="text-xs text-slate-400 mb-4">
          Hasil analisis rule engine
        </p>
        <div className="flex flex-col gap-2">
          {insight.insights.map((item, i) => (
            <div
              key={i}
              className="flex flex-wrap items-start gap-3 sm:flex-nowrap p-3 rounded-xl border border-border bg-[#1e293b]/50"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ background: DOT_COLOR[item.type] ?? "#64748b" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-0.5">
                  {item.title}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-1 ${PRIORITY_STYLE[item.priority].background} ${PRIORITY_STYLE[item.priority].color}`}
              >
                {item.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card border border-border p-5">
        <p className="text-sm font-bold text-white mb-1">Rekomendasi Aksi</p>
        <p className="text-xs text-slate-400 mb-4">Berdasarkan analisis AI</p>
        <div className="flex flex-col gap-3">
          {insight.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#7F77DD]/20 text-[#7F77DD] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
