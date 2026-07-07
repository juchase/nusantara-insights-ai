"use client";

import { InsightResponse } from "@/types/insight";
import { Cpu, Sparkles, Upload, ChevronDown, Info } from "lucide-react";
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
        <div className="glass-card border border-border rounded-xl p-5 flex flex-col justify-between gap-4 relative">
          <div className="flex items-center gap-2.5 group cursor-help w-fit relative">
            <div className="w-7 h-7 shrink-0 rounded-md bg-[#7F77DD]/15 border border-[#7F77DD]/20 flex items-center justify-center text-[#7F77DD]">
              <Sparkles size={14} />
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Business Status
              </p>
              <Info size={12} className="text-slate-500" />
            </div>
            {/* Tooltip Content - Diubah ke top-full mt-2 (muncul di bawah) */}
            <div className="absolute left-0 top-full mt-2 w-56 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
              <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
                Status risiko bisnis dihitung dari gabungan sentimen negatif
                pelanggan dan tren penurunan permintaan saat ini.
              </p>
            </div>
          </div>
          <div>
            {insight ? (
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg inline-block w-fit ${riskBadge(insight.risk_level)}`}
              >
                {riskLabel(insight.risk_level)}
              </span>
            ) : (
              <span className="text-sm text-slate-500">—</span>
            )}
          </div>
        </div>

        {/* KARTU 2: Product Selector */}
        <div className="glass-card border border-border rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center h-7">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Produk Aktif
            </p>
          </div>
          <div className="relative w-full">
            <select
              value={selectedProduct}
              onChange={(e) => onProductChange(e.target.value)}
              className="w-full bg-[#1e293b]/80 hover:bg-[#1e293b] border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all appearance-none pr-8 cursor-pointer truncate"
            >
              {products.map((p) => {
                const maxLength = 35;
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* KARTU 3: Health Score */}
        <div className="glass-card border border-border rounded-xl p-5 flex flex-col justify-between gap-4 relative">
          <div className="flex items-center justify-between h-7">
            <div className="flex items-center gap-1.5 group cursor-help relative">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Health Score
              </p>
              <Info size={12} className="text-slate-500" />
              {/* Tooltip Content - Diubah ke top-full mt-2 dan right-0 (muncul di bawah rata kanan) */}
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-56 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
                  Metrik kesehatan produk berskala 0-100. Dihitung otomatis oleh
                  AI berdasarkan rasio sentimen pelanggan dan stabilitas
                  penjualan.
                </p>
              </div>
            </div>
            {insight && (
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${healthColor(insight.health_label ?? "")}`}
              >
                {insight.health_label ?? "—"}
              </span>
            )}
          </div>
          <div>
            {insight ? (
              <p className="text-3xl font-bold text-white leading-none flex items-baseline gap-1.5">
                {insight.health_score}
                <span className="text-sm font-medium text-slate-500">
                  / 100
                </span>
              </p>
            ) : (
              <span className="text-sm text-slate-500">—</span>
            )}
          </div>
        </div>
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

        {/* Footer badges with Tooltips */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="group relative cursor-help flex items-center">
            {insight?.llm_used === true ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded-full bg-[#7F77DD]/20 text-[#7F77DD]">
                <Cpu size={11} /> Qwen2.5 Enhanced
                <Info size={12} className="text-slate-500" />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 border border-border px-3 py-1 rounded-full bg-slate-800/50">
                Rule engine fallback
                <Info size={12} className="text-slate-500" />
              </span>
            )}
            {/* Tooltip Content (Tetap bottom-full karena di area bawah kartu) */}
            <div className="absolute left-0 bottom-full mb-2 w-52 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                {insight?.llm_used === true
                  ? "Analisis teks ini dihasilkan oleh model AI Generatif (Qwen) untuk akurasi insight yang lebih mendalam."
                  : "Insight ini dihasilkan oleh sistem algoritma standar karena batas penggunaan AI generatif telah tercapai atau tidak stabil."}
              </p>
            </div>
          </div>

          {insight?.confidence !== undefined && insight.confidence > 0 && (
            <div className="group relative cursor-help flex items-center">
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-[#1e293b] px-3 py-1 rounded-full border border-border">
                Confidence: {insight.confidence.toFixed(1)}%
                <Info size={10} className="text-slate-500 ml-0.5" />
              </span>
              {/* Tooltip Content (Tetap bottom-full karena di area bawah kartu) */}
              <div className="absolute left-0 bottom-full mb-2 w-48 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                  Tingkat keyakinan model terhadap prediksi dan sentimen ini.
                  Dipengaruhi oleh kualitas dan jumlah data historis yang
                  tersedia.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
