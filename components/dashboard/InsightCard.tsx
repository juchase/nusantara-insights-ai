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
      return "bg-secondary/15 text-secondary";
    if (label === "Perlu Perhatian") return "bg-primary/15 text-primary";
    return "bg-danger/15 text-danger";
  };

  const riskColor = (risk?: string) => {
    if (risk === "high") return "bg-danger/15 text-danger border-danger/30";
    if (risk === "medium")
      return "bg-primary/15 text-primary border-primary/30";
    return "bg-secondary/15 text-secondary border-secondary/30";
  };

  const riskLabel = (risk?: string) => {
    if (risk === "high") return "Risiko Tinggi";
    if (risk === "medium") return "Risiko Sedang";
    return "Risiko Rendah";
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return "var(--color-secondary)";
    if (score >= 50) return "var(--color-primary)";
    return "var(--color-danger)";
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
          <div className="w-14 h-14 rounded-xl bg-tertiary/20 flex items-center justify-center text-tertiary">
            <Sparkles size={26} />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground mb-1">
              Belum ada data untuk dianalisis
            </p>
            <p className="text-sm text-muted max-w-md leading-relaxed">
              Upload dataset ulasan dan penjualan produk Anda untuk mulai
              melihat insight bisnis, prediksi permintaan, dan analisis sentimen
              pelanggan.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background font-bold text-sm hover:bg-primary/80 transition"
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
        {/* KARTU 1: Business Status (Full Width) */}
        <div className="glass-card border border-border rounded-xl p-5 flex flex-col justify-between gap-3 relative">
          <div className="flex items-center gap-2.5 group cursor-help w-fit relative">
            <div className="w-7 h-7 shrink-0 rounded-md bg-tertiary/15 border border-tertiary/20 flex items-center justify-center text-tertiary">
              <Sparkles size={14} />
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Business Status
              </p>
              <Info size={12} className="text-muted" />
            </div>
            <div className="absolute left-0 top-full mt-2 w-56 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
              <p className="text-[11px] text-muted font-normal leading-relaxed">
                Status risiko bisnis dihitung dari gabungan sentimen negatif
                pelanggan dan tren penurunan permintaan saat ini.
              </p>
            </div>
          </div>
          <div>
            {insight ? (
              <div
                className={`w-full py-2 px-4 rounded-lg border ${riskColor(insight.risk_level)} flex items-center justify-between`}
              >
                <span className="text-sm font-semibold">
                  {riskLabel(insight.risk_level)}
                </span>
                <span className="text-xs opacity-80">
                  {insight.risk_level === "high"
                    ? "⚠️"
                    : insight.risk_level === "medium"
                      ? "⚡"
                      : "✅"}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted">—</span>
            )}
          </div>
        </div>

        {/* KARTU 2: Product Selector */}
        <div className="glass-card border border-border rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center h-7">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Produk Aktif
            </p>
          </div>
          <div className="relative w-full">
            <select
              value={selectedProduct}
              onChange={(e) => onProductChange(e.target.value)}
              className="w-full bg-card/80 hover:bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none pr-8 cursor-pointer truncate"
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
                    className="bg-card text-foreground"
                  >
                    {truncatedName}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* KARTU 3: Health Score (dengan Progress Bar) */}
        <div className="glass-card border border-border rounded-xl p-5 flex flex-col justify-between gap-3 relative">
          <div className="flex items-center justify-between h-7">
            <div className="flex items-center gap-1.5 group cursor-help relative">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Health Score
              </p>
              <Info size={12} className="text-muted" />
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-56 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-muted font-normal leading-relaxed">
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
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <p className="text-2xl font-bold text-foreground leading-none">
                {insight ? insight.health_score : "—"}
              </p>
              <span className="text-xs text-muted font-medium">
                {insight ? `/ 100` : ""}
              </span>
            </div>
            {/* Progress Bar */}
            {insight && (
              <div className="w-full h-2 bg-card/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(insight.health_score, 100)}%`,
                    backgroundColor: getHealthColor(insight.health_score),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── EXECUTIVE SUMMARY ─── */}
      <div className="pt-6">
        {insight?.executive_summary ? (
          <p className="text-sm text-foreground leading-relaxed">
            {insight.executive_summary}
          </p>
        ) : (
          <p className="text-sm text-muted leading-relaxed">
            Produk ini belum memiliki insight. Pipeline AI mungkin masih
            memproses data, atau belum ada ulasan/penjualan yang diupload untuk
            produk ini.
          </p>
        )}

        {insight?.summary ? (
          insight.summary !== insight.executive_summary && (
            <div className="border-t border-border mt-3 pt-3">
              <p className="text-xs text-muted leading-relaxed">
                {insight.summary}
              </p>
            </div>
          )
        ) : (
          <p className="text-xs text-muted leading-relaxed mt-2">
            Upload ulasan dan data penjualan untuk produk ini agar AI dapat
            menghasilkan insight.
          </p>
        )}

        {/* Footer badges with Tooltips */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="group relative cursor-help flex items-center">
            {insight?.llm_used === true ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded-full bg-tertiary/20 text-tertiary">
                <Cpu size={11} /> Qwen2.5 Enhanced
                <Info size={12} className="text-muted" />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-muted border border-border px-3 py-1 rounded-full bg-card/50">
                Rule engine fallback
                <Info size={12} className="text-muted" />
              </span>
            )}
            <div className="absolute left-0 bottom-full mb-2 w-52 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
              <p className="text-[11px] text-muted font-normal leading-relaxed">
                {insight?.llm_used === true
                  ? "Analisis teks ini dihasilkan oleh model AI Generatif (Qwen) untuk akurasi insight yang lebih mendalam."
                  : "Insight ini dihasilkan oleh sistem algoritma standar karena batas penggunaan AI generatif telah tercapai atau tidak stabil."}
              </p>
            </div>
          </div>

          {insight?.confidence !== undefined && insight.confidence > 0 && (
            <div className="group relative cursor-help flex items-center">
              <span className="text-[10px] font-medium text-muted flex items-center gap-1 bg-card px-3 py-1 rounded-full border border-border">
                Confidence: {insight.confidence.toFixed(1)}%
                <Info size={10} className="text-muted ml-0.5" />
              </span>
              <div className="absolute left-0 bottom-full mb-2 w-48 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <p className="text-[11px] text-muted font-normal leading-relaxed">
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
