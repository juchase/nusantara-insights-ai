"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  AlertTriangle,
  MessageSquareWarning,
  Info,
} from "lucide-react";
import CardSkeleton from "./skeleton/CardSkeleton";

interface ProductRank {
  id: string;
  name: string;
  totalReviews: number;
  positiveRate: number;
  negativeRate: number;
  healthScore: number;
  riskLevel: string;
  dominantIssue: string;
}

interface RankingData {
  best: ProductRank | null;
  worst: ProductRank | null;
  mostComplaints: ProductRank | null;
  all: ProductRank[];
  total: number;
}

const RISK_STYLE: Record<string, { bg: string; color: string; label: string }> =
  {
    low: { bg: "bg-[#009B77]/15", color: "text-[#009B77]", label: "Rendah" },
    medium: { bg: "bg-[#F59E0B]/15", color: "text-[#F59E0B]", label: "Sedang" },
    high: { bg: "bg-[#E24B4A]/15", color: "text-[#E24B4A]", label: "Tinggi" },
    unknown: { bg: "bg-[#1e293b]", color: "text-[#6b7280]", label: "—" },
  };

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "#009B77" : value >= 45 ? "#F59E0B" : "#E24B4A";
  return (
    <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function TopCard({
  icon,
  label,
  iconColor,
  iconBg,
  product,
}: {
  icon: React.ReactNode;
  label: string;
  iconColor: string;
  iconBg: string;
  product: ProductRank | null;
}) {
  if (!product) return null;
  const risk = RISK_STYLE[product.riskLevel] ?? RISK_STYLE.unknown;

  return (
    <div className="glass-card border border-border flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>

      <p
        className="text-sm font-medium text-white mb-2 truncate"
        title={product.name}
      >
        {product.name}
      </p>

      {/* TOOLTIP: Health Score */}
      <div className="flex items-center gap-2 mb-1.5 group cursor-help relative">
        <span className="text-[10px] text-slate-400 w-16 shrink-0 flex items-center gap-1">
          Health <Info size={10} className="text-slate-500" />
        </span>
        <ScoreBar value={product.healthScore} />
        <span className="text-[10px] font-bold text-white w-8 text-right">
          {product.healthScore}
        </span>

        <div className="absolute bottom-full left-0 mb-1.5 w-60 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 pointer-events-none">
          <p className="text-[10px] text-slate-300 font-normal leading-relaxed">
            <strong className="text-white">Health Score:</strong> Indikator
            kesehatan performa produk (skala 0-100) yang digabungkan dari rasio
            sentimen ulasan, volume komplain, dan stabilitas kepuasan pelanggan.
          </p>
        </div>
      </div>

      {/* TOOLTIP: Sentimen Positif */}
      <div className="flex items-center gap-2 mb-3 group cursor-help relative">
        <span className="text-[10px] text-slate-400 w-16 shrink-0 flex items-center gap-1">
          Positif <Info size={10} className="text-slate-500" />
        </span>
        <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#009B77]"
            style={{ width: `${product.positiveRate}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-white w-8 text-right">
          {product.positiveRate}%
        </span>

        <div className="absolute bottom-full left-0 mb-1.5 w-60 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 pointer-events-none">
          <p className="text-[10px] text-slate-300 font-normal leading-relaxed">
            <strong className="text-white">Rasio Positif:</strong> Persentase
            ulasan konsumen yang mengandung sentimen apresiatif, kepuasan, atau
            rekomendasi produk dari total ulasan masuk.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
        <span className="text-[10px] text-slate-500">
          {product.totalReviews} ulasan
        </span>

        {/* TOOLTIP: Tingkat Risiko */}
        <div className="group cursor-help relative">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${risk.bg} ${risk.color}`}
          >
            {risk.label}
          </span>
          <div className="absolute bottom-full right-0 mb-1.5 w-56 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 pointer-events-none">
            <p className="text-[10px] text-slate-300 font-normal leading-relaxed text-left">
              <strong className="text-white">Status Risiko:</strong> Tingkat
              urgensi intervensi manajemen operasional berdasarkan keparahan
              komplain utama (
              <span className="italic">
                {product.dominantIssue || "tidak ada"}
              </span>
              ).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass-card-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-5 border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ProductRanking() {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/product-ranking")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CardSkeleton />;
  if (!data || data.total === 0) return null;

  return (
    <div className="glass-card-lg border border-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-bold text-white">Performa Produk</p>
          <p className="text-xs text-slate-400 mt-1">
            Perbandingan {data.total} produk berdasarkan health score
          </p>
        </div>
        {data.total > 3 && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-bold text-[#F59E0B] hover:text-[#D97706] transition"
          >
            {`Lihat semua (${data.total})`}
          </button>
        )}
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
        {data.total === 1 ? (
          <div className="md:col-span-3">
            <TopCard
              label="Ringkasan Produk"
              icon={<Trophy size={14} />}
              iconColor="text-[#009B77]"
              iconBg="bg-[#009B77]/15"
              product={data.best}
            />
          </div>
        ) : (
          <>
            <TopCard
              label="Terbaik"
              icon={<Trophy size={14} />}
              iconColor="text-[#009B77]"
              iconBg="bg-[#009B77]/15"
              product={data.best}
            />
            <TopCard
              label="Perlu Perhatian"
              icon={<AlertTriangle size={14} />}
              iconColor="text-[#F59E0B]"
              iconBg="bg-[#F59E0B]/15"
              product={data.worst}
            />
            <TopCard
              label="Keluhan Terbanyak"
              icon={<MessageSquareWarning size={14} />}
              iconColor="text-[#E24B4A]"
              iconBg="bg-[#E24B4A]/15"
              product={data.mostComplaints}
            />
          </>
        )}
      </div>

      {/* Modal daftar produk */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Daftar Produk">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-border px-2">
              <span className="w-8">Rank</span>
              <span className="flex-1">Produk</span>
              <span className="w-24 text-right">Health</span>
              <span className="w-12 text-right">Pos</span>
              <span className="w-16 text-center">Risiko</span>
            </div>
            <div className="max-h-[40vh] overflow-y-auto pr-1 space-y-1">
              {data.all.map((p, i) => {
                const risk = RISK_STYLE[p.riskLevel] || RISK_STYLE.unknown;
                const isTopThree = i < 3;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg text-xs transition-colors ${
                      i === 0
                        ? "bg-[#1e293b]/50 border border-border"
                        : "hover:bg-[#1e293b]/30"
                    }`}
                  >
                    <span
                      className={`w-8 font-bold ${isTopThree ? "text-[#F59E0B]" : "text-slate-500"}`}
                    >
                      #{i + 1}
                    </span>
                    <span className="flex-1 text-white truncate" title={p.name}>
                      {p.name}
                    </span>
                    <div className="w-24 flex items-center gap-2 justify-end">
                      <ScoreBar value={p.healthScore} />
                      <span className="text-white font-bold w-6 text-right">
                        {p.healthScore}
                      </span>
                    </div>
                    <span className="w-12 text-right text-slate-400 font-medium">
                      {p.positiveRate}%
                    </span>
                    <span
                      className={`w-16 text-center text-[9px] font-bold px-1.5 py-0.5 rounded-full ${risk.bg} ${risk.color}`}
                    >
                      {risk.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
