"use client";

import { InsightResponse } from "@/types/insight";
import InsightPanelSkeleton from "@/components/dashboard/skeleton/InsightPanelSkeleton";
import { Info } from "lucide-react"; // Import ikon Info

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
      {/* ─── Insights Panel ─── */}
      <div className="glass-card border border-border p-5">
        {/* Judul dengan Tooltip */}
        <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
          <p className="text-sm font-bold text-white">AI Insight Bisnis</p>
          <Info size={14} className="text-slate-500" />
          {/* Tooltip Content */}
          <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
            <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
              Temuan utama terkait performa bisnis, sentimen pelanggan, dan tren
              penjualan yang diekstrak secara otomatis oleh sistem.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Hasil analisis {insight.llm_used ? "AI Generatif" : "rule engine"}
        </p>

        <div className="flex flex-col gap-2">
          {insight.insights.map((item, i) => (
            <div
              key={i}
              className="flex flex-wrap items-start gap-3 sm:flex-nowrap p-3 rounded-xl border border-border bg-[#1e293b]/50"
            >
              {/* Dot Indikator */}
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ background: DOT_COLOR[item.type] ?? "#64748b" }}
              />

              {/* Konten Teks */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-0.5">
                  {item.title}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Label Prioritas dengan Tooltip */}
              <div className="group/badge relative cursor-help shrink-0 mt-1 flex">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[item.priority]?.background} ${PRIORITY_STYLE[item.priority]?.color}`}
                >
                  {item.priority}
                </span>
                {/* Tooltip Content untuk Badge */}
                <div className="absolute right-0 top-full mt-2 w-48 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all duration-200 z-30 pointer-events-none">
                  <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
                    {item.priority === "HIGH" &&
                      "Prioritas Tinggi: Membutuhkan tindakan segera karena berdampak signifikan pada bisnis."}
                    {item.priority === "MEDIUM" &&
                      "Prioritas Sedang: Isu menengah yang perlu dievaluasi dalam waktu dekat."}
                    {item.priority === "LOW" &&
                      "Prioritas Rendah: Temuan minor, dapat dioptimasi nanti."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Recommendations Panel ─── */}
      <div className="glass-card border border-border p-5">
        {/* Judul dengan Tooltip */}
        <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
          <p className="text-sm font-bold text-white">Rekomendasi Aksi</p>
          <Info size={14} className="text-slate-500" />
          {/* Tooltip Content */}
          <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
            <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
              Langkah-langkah strategis yang disarankan untuk mengatasi masalah
              atau memaksimalkan peluang berdasarkan insight di samping.
            </p>
          </div>
        </div>

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
