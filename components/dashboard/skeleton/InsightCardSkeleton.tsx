export default function InsightCardSkeleton() {
  return (
    <div className="glass-card-lg p-6 mt-4 animate-pulse border border-border">
      <div className="h-4 w-32 rounded bg-card mb-4" />
      <div className="h-6 w-3/4 rounded bg-card mb-3" />
      <div className="h-4 w-full rounded bg-card/60" />
    </div>
  );
}
