export default function SentimentDistributionSkeleton() {
  return (
    <div className="glass-card border border-border p-5 animate-pulse">
      <div className="mb-1 h-3 w-32 rounded bg-[#1e293b]" />
      <div className="mb-4 h-2.5 w-24 rounded bg-[#1e293b]/60" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-2">
            <div className="h-2.5 w-12 shrink-0 rounded bg-[#1e293b]" />
            <div className="h-2 flex-1 rounded-full bg-[#1e293b]/60" />
            <div className="h-2.5 w-8 shrink-0 rounded bg-[#1e293b]" />
          </div>
        ))}
      </div>
    </div>
  );
}
