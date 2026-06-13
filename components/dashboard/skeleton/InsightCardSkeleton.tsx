export default function InsightCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-slate-900 p-8">
      <div className="h-4 w-32 rounded bg-slate-700 mb-4" />
      <div className="h-6 w-3/4 rounded bg-slate-700 mb-3" />
      <div className="h-4 w-full rounded bg-slate-800" />
    </div>
  );
}
