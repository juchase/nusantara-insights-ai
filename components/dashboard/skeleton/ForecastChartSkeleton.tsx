export default function ForecastChartSkeleton() {
  return (
    <div className="glass-card-lg p-5 sm:p-6 lg:p-7 min-h-[420px] animate-pulse border border-border">
      <div className="mb-1 h-3 w-40 rounded bg-card" />
      <div className="mb-6 h-2.5 w-56 rounded bg-card/60" />

      <div className="mb-2 h-2.5 w-32 rounded bg-card" />
      <div className="mb-6 h-9 w-28 rounded bg-card" />

      <div className="mb-3 h-16 rounded-xl bg-card/60" />

      <div className="grid grid-cols-2 gap-2">
        <div className="h-16 rounded-xl bg-card/60" />
        <div className="h-16 rounded-xl bg-card/60" />
      </div>
    </div>
  );
}
