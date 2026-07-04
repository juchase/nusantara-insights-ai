"use client";

import { InsightResponse } from "@/types/insight";
import { Cpu, Sparkles, Upload, ChevronDown } from "lucide-react";
import Link from "next/link";
import InsightCardSkeleton from "@/components/dashboard/skeleton/InsightCardSkeleton";

interface Props {
  insight: InsightResponse | null;
  products: { id: string; name: string }[];
  selectedProduct: string;
  onProductChange: (value: string) => void;
  loading: boolean;
}

export default function InsightCard({
  insight,
  products,
  selectedProduct,
  onProductChange,
  loading,
}: Props) {
  // ── Warna status kesehatan ──────────────────────────────
  const healthColor = (label: string) => {
    if (label === "Sangat Baik" || label === "Baik")
      return "bg-[#009B77]/15 text-[#009B77]";
    if (label === "Perlu Perhatian") return "bg-[#F59E0B]/15 text-[#F59E0B]";
    return "bg-[#E24B4A]/15 text-[#E24B4A]";
  };

  const riskBadge = (risk?: string) => {
    if (risk === "high") return "bg-[#E24B4A]/15 text-[#E24B4A]";
    if (risk === "medium") return "bg-[#F59E0B]/15 text-[#F59E0B]";
    return "bg-[#009B77]/15 text-[#009B77]";
  };

  const riskLabel = (risk?: string) => {
    if (risk === "high") return "Risiko Tinggi";
    if (risk === "medium") return "Risiko Sedang";
    return "Risiko Rendah";
  };

  // ── LOADING ──────────────────────────────────────────────
  if (loading) {
    return <InsightCardSkeleton />;
  }

  // ── EMPTY TOTAL — belum ada produk ──────────────────────
  if (products.length === 0) {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl sm:mt-5 lg:mt-6 glass-card-lg p-8 sm:p-12 border border-border">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#7F77DD]/20 flex items-center justify-center text-[#7F77DD]">
            <Sparkles size={26} />
          </div>
          <div>
            <p className="text-lg font-medium text-white mb-1">
              Belum ada data untuk dianalisis
            </p>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Upload dataset ulasan dan penjualan produk Anda untuk mulai
              melihat insight bisnis, prediksi permintaan, dan analisis sentimen
              pelanggan.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] text-background font-bold text-sm hover:bg-[#D97706] transition"
          >
            <Upload size={15} />
            Upload Dataset Pertama
          </Link>
        </div>
      </div>
    );
  }

  // ── PRODUK ADA ─────────────────────────────────────────────
  return (
    <div className="mt-4 overflow-hidden rounded-2xl sm:mt-5 lg:mt-6 glass-card-lg p-6 sm:p-8 border border-border">
      {/* ─── 3 KARTU HEADER ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-border">
        {/* KARTU 1: Business Status */}
        <div className="glass-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-[#7F77DD]/15 border border-[#7F77DD]/20 flex items-center justify-center text-[#7F77DD]">
            <Sparkles size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
              Business Status
            </p>
            {insight && (
              <span
                className={`text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full w-fit truncate ${riskBadge(insight.risk_level)}`}
              >
                {riskLabel(insight.risk_level)}
              </span>
            )}
          </div>
        </div>

        {/* KARTU 2: Product Selector */}
        <div className="glass-card border border-border rounded-xl p-4 flex flex-col justify-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Produk Aktif
          </p>
          <div className="relative">
            <select
              value={selectedProduct}
              onChange={(e) => onProductChange(e.target.value)}
              className="w-full bg-[#1e293b] border border-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#F59E0B] truncate appearance-none pr-8"
            >
              {products.map((p) => {
                const maxLength = 40;
                const truncatedName =
                  p.name.length > maxLength
                    ? p.name.substring(0, maxLength) + "..."
                    : p.name;
                return (
                  <option
                    key={p.id}
                    value={p.id}
                    title={p.name}
                    className="bg-[#1e293b] text-white"
                  >
                    {truncatedName}
                  </option>
                );
              })}
            </select>
            {/* Custom Chevron */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* KARTU 3: Health Score */}
        {insight && (
          <div className="glass-card border border-border rounded-xl p-4 flex flex-col items-start md:items-end justify-center">
            <p className="text-3xl font-bold text-white leading-none flex items-baseline gap-1">
              {insight.health_score}
              <span className="text-sm font-medium text-slate-400">/ 100</span>
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
              Health Score
            </p>
            <span
              className={`text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full inline-block w-fit ${healthColor(insight.health_label ?? "")}`}
            >
              {insight.health_label ?? "—"}
            </span>
          </div>
        )}
      </div>

      {/* ─── EXECUTIVE SUMMARY ─── */}
      <div className="pt-6">
        {insight?.executive_summary ? (
          <p className="text-sm text-slate-200 leading-relaxed">
            {insight.executive_summary}
          </p>
        ) : (
          <p className="text-sm text-slate-400 leading-relaxed">
            Produk ini belum memiliki insight. Pipeline AI mungkin masih
            memproses data, atau belum ada ulasan/penjualan yang diupload untuk
            produk ini.
          </p>
        )}

        {insight?.summary ? (
          insight.summary !== insight.executive_summary && (
            <div className="border-t border-border mt-3 pt-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                {insight.summary}
              </p>
            </div>
          )
        ) : (
          <p className="text-xs text-slate-400 leading-relaxed mt-2">
            Upload ulasan dan data penjualan untuk produk ini agar AI dapat
            menghasilkan insight.
          </p>
        )}

        {/* Footer badges */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {insight?.llm_used === true ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded-full bg-[#7F77DD]/20 text-[#7F77DD]">
              <Cpu size={11} /> Qwen2.5 Enhanced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
              Rule engine fallback
            </span>
          )}

          {insight?.confidence !== undefined && insight.confidence > 0 && (
            <span className="text-[10px] text-slate-400">
              Confidence: {insight.confidence.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
