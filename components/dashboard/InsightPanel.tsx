"use client";

import { InsightResponse } from "@/types/insight";
import InsightPanelSkeleton from "@/components/dashboard/skeleton/InsightPanelSkeleton";
import { Info } from "lucide-react";

interface Props {
  insight: InsightResponse | null;
  totalReviews?: number;
  avgRating?: number;
  totalProducts?: number;
  loading: boolean;
}

// Warna dot menggunakan variabel tema
const DOT_COLOR: Record<string, string> = {
  warning: "var(--color-primary)", // Emas
  positive: "var(--color-secondary)", // Zamrud
  danger: "var(--color-danger)", // Merah
  opportunity: "var(--color-tertiary)", // Indigo
  neutral: "var(--color-muted)", // Slate
};

const PRIORITY_STYLE: Record<string, { className: string }> = {
  HIGH: { className: "bg-danger/15 text-danger" },
  MEDIUM: { className: "bg-primary/15 text-primary" },
  LOW: { className: "bg-secondary/15 text-secondary" },
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
          <p className="text-sm font-bold text-foreground">AI Insight Bisnis</p>
          <Info size={14} className="text-muted" />
          {/* Tooltip Content */}
          <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
            <p className="text-[11px] text-muted font-normal normal-case tracking-normal leading-relaxed">
              Temuan utama terkait performa bisnis, sentimen pelanggan, dan tren
              penjualan yang diekstrak secara otomatis oleh sistem.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted mb-4">
          Hasil analisis {insight.llm_used ? "AI Generatif" : "rule engine"}
        </p>

        <div className="flex flex-col gap-2">
          {insight.insights.map((item, i) => (
            <div
              key={i}
              className="flex flex-wrap items-start gap-3 sm:flex-nowrap p-3 rounded-xl border border-border bg-card/50"
            >
              {/* Dot Indikator */}
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{
                  background: DOT_COLOR[item.type] ?? "var(--color-muted)",
                }}
              />

              {/* Konten Teks */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5">
                  {item.title}
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Label Prioritas dengan Tooltip */}
              <div className="group/badge relative cursor-help shrink-0 mt-1 flex">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[item.priority]?.className}`}
                >
                  {item.priority}
                </span>
                {/* Tooltip Content untuk Badge */}
                <div className="absolute right-0 top-full mt-2 w-48 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all duration-200 z-30 pointer-events-none">
                  <p className="text-[11px] text-muted font-normal normal-case tracking-normal leading-relaxed">
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
          <p className="text-sm font-bold text-foreground">Rekomendasi Aksi</p>
          <Info size={14} className="text-muted" />
          {/* Tooltip Content */}
          <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
            <p className="text-[11px] text-muted font-normal normal-case tracking-normal leading-relaxed">
              Langkah-langkah strategis yang disarankan untuk mengatasi masalah
              atau memaksimalkan peluang berdasarkan insight di samping.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted mb-4">Berdasarkan analisis AI</p>

        <div className="flex flex-col gap-3">
          {insight.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-muted leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
