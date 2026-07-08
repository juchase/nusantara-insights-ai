export default function RiskOverviewSkeleton() {
  return (
    <div className="glass-card border border-border p-5 animate-pulse">
      <div className="mb-1 h-3 w-24 rounded bg-[#1e293b]" />
      <div className="mb-4 h-2.5 w-36 rounded bg-[#1e293b]/60" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="flex items-center justify-between rounded-lg bg-[#1e293b]/50 px-3 py-2.5"
          >
            <div className="h-2.5 w-20 rounded bg-[#1e293b]" />
            <div className="h-2.5 w-16 rounded bg-[#1e293b]" />
          </div>
        ))}
      </div>
    </div>
  );
}
