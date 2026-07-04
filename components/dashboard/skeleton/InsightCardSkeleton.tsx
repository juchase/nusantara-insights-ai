export default function InsightCardSkeleton() {
  return (
    <div className="glass-card-lg p-6 mt-4 animate-pulse border border-border">
      <div className="h-4 w-32 rounded bg-[#1e293b] mb-4" />
      <div className="h-6 w-3/4 rounded bg-[#1e293b] mb-3" />
      <div className="h-4 w-full rounded bg-[#1e293b]/60" />
    </div>
  );
}
