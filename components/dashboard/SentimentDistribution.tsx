"use client";

import SentimentDistributionSkeleton from "@/components/dashboard/skeleton/SentimentDistributionSkeleton";
import { Info } from "lucide-react"; // Tambahkan import ikon Info

interface Props {
  positive: number;
  neutral: number;
  negative: number;
  loading: boolean;
}

const BARS = [
  { label: "Positif", key: "positive" as const, color: "#009B77" },
  { label: "Netral", key: "neutral" as const, color: "#64748b" },
  { label: "Negatif", key: "negative" as const, color: "#E24B4A" },
];

export default function SentimentDistribution({
  positive,
  neutral,
  negative,
  loading,
}: Props) {
  if (loading) return <SentimentDistributionSkeleton />;
  if (positive === 0 && neutral === 0 && negative === 0) return null;

  const data = { positive, neutral, negative };

  return (
    <div className="glass-card border border-border p-5">
      {/* ── Judul dengan Tooltip ── */}
      <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
        <p className="text-sm font-bold text-white">Distribusi Sentimen</p>
        <Info size={14} className="text-slate-500" />

        {/* Konten Tooltip */}
        <div className="absolute left-0 top-full mt-2 w-60 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
          <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
            Persentase ulasan pelanggan yang dikategorikan ke dalam sentimen
            Positif, Netral, dan Negatif oleh model analisis AI.
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">30 hari terakhir</p>

      <div className="flex flex-col gap-3">
        {BARS.map((bar) => (
          <div key={bar.key} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-14 shrink-0 font-medium">
              {bar.label}
            </span>
            <div className="flex-1 h-2 bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${data[bar.key]}%`, background: bar.color }}
              />
            </div>
            <span className="text-xs font-bold text-white w-9 text-right shrink-0">
              {data[bar.key]}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
