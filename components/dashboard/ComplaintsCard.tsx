"use client";

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
      <p className="text-sm font-bold text-white mb-1">Keluhan Pelanggan</p>
      <p className="text-xs text-slate-400 mb-4">
        Kategori keluhan yang paling sering muncul di ulasan produk ini
      </p>

      <div className="flex flex-col gap-3">
        {data.map(([category, count], i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-24 shrink-0 truncate capitalize">
              {category}
            </span>
            <div className="flex-1 h-2 bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(count / maxCount) * 100}%`,
                  background: i === 0 ? "#E24B4A" : "#7F77DD",
                }}
              />
            </div>
            <span className="text-xs text-slate-400 w-12 text-right shrink-0">
              {count} sebutan
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
