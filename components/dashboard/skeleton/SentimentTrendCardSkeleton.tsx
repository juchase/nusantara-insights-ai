export default function SentimentTrendCardSkeleton() {
  return (
    <div className="glass-card border border-border p-5 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-1 h-3 w-24 rounded bg-[#1e293b]" />
          <div className="h-2.5 w-32 rounded bg-[#1e293b]/60" />
        </div>
        <div className="h-5 w-20 rounded-full bg-[#1e293b]/60" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-[#1e293b]/50 p-3 text-center">
          <div className="mx-auto mb-2 h-2 w-16 rounded bg-[#1e293b]" />
          <div className="mx-auto h-5 w-12 rounded bg-[#1e293b]" />
        </div>
        <div className="h-4 w-4 shrink-0 rounded bg-[#1e293b]" />
        <div className="flex-1 rounded-lg bg-[#1e293b]/50 p-3 text-center">
          <div className="mx-auto mb-2 h-2 w-16 rounded bg-[#1e293b]" />
          <div className="mx-auto h-5 w-12 rounded bg-[#1e293b]" />
        </div>
      </div>

      <div className="h-8 rounded-lg bg-[#1e293b]/60" />
    </div>
  );
}
