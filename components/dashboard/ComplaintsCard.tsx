"use client";

import { Info } from "lucide-react";
import ComplaintsCardSkeleton from "@/components/dashboard/skeleton/ComplaintsCardSkeleton";

export default function ComplaintsCard({
  data,
  loading,
}: {
  data: [string, number][];
  loading: boolean;
}) {
  if (loading) return <ComplaintsCardSkeleton />;
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(([, count]) => count), 1);

  return (
    <div className="glass-card border border-border p-5">
      {/* Header dengan Tooltip Utama */}
      <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
        <p className="text-sm font-bold text-white">Keluhan Pelanggan</p>
        <Info size={14} className="text-slate-500" />
        <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 pointer-events-none">
          <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
            Distribusi topik komplain yang diekstraksi otomatis oleh AI dari
            ulasan bersentimen negatif guna membantu tim operasional memetakan
            masalah utama produk.
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Kategori keluhan yang paling sering muncul di ulasan produk ini
      </p>

      <div className="flex flex-col gap-3">
        {data.map(([category, count], i) => (
          <div
            key={i}
            className="flex items-center gap-3 group/row cursor-help relative"
          >
            {/* Nama Kategori */}
            <span className="text-xs text-slate-400 w-24 shrink-0 truncate capitalize">
              {category}
            </span>

            {/* Bar Progres dengan Tooltip Detail */}
            <div className="flex-1 h-2 bg-[#1e293b] rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(count / maxCount) * 100}%`,
                  background: i === 0 ? "#E24B4A" : "#7F77DD",
                }}
              />
            </div>

            {/* Jumlah Sebutan */}
            <span className="text-xs text-slate-400 w-12 text-right shrink-0">
              {count} sebutan
            </span>

            {/* Tooltip Baris Kategori */}
            <div className="absolute bottom-full left-24 mb-1 w-56 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover/row:opacity-100 group-hover/row:visible transition-all duration-150 z-20 pointer-events-none">
              <p className="text-[10px] text-slate-300 font-normal leading-relaxed">
                Masalah{" "}
                <span className="text-white font-medium capitalize">
                  "{category}"
                </span>{" "}
                telah diidentifikasi sebanyak{" "}
                <span className="text-white font-bold">{count} kali</span> pada
                riwayat umpan balik pelanggan.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
