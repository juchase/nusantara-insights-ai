export default function SalesChartSkeleton() {
  return (
    <div className="glass-card px-4 py-5 sm:px-6 animate-pulse border border-border">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="mb-2 h-3 w-44 rounded bg-[#1e293b]" />
          <div className="h-2.5 w-56 rounded bg-[#1e293b]/60" />
        </div>
        <div className="flex gap-3">
          <div className="h-2.5 w-14 rounded bg-[#1e293b]/60" />
          <div className="h-2.5 w-14 rounded bg-[#1e293b]/60" />
        </div>
      </div>

      <div className="h-[260px] rounded-lg bg-[#1e293b]/50" />

      <div className="mt-3 h-8 rounded-lg bg-[#1e293b]/60" />
    </div>
  );
}
