export default function ForecastChartSkeleton() {
  return (
    <div
      className="min-w-0 animate-pulse p-5 sm:p-6 lg:p-7"
      style={{ minHeight: 420, borderRadius: 20, background: "#1a1a2e" }}
    >
      <div className="mb-1 h-3 w-40 rounded bg-slate-700" />
      <div className="mb-6 h-2.5 w-56 rounded bg-slate-800" />

      <div className="mb-2 h-2.5 w-32 rounded bg-slate-700" />
      <div className="mb-6 h-9 w-28 rounded bg-slate-700" />

      <div className="mb-3 h-16 rounded-xl bg-slate-800" />

      <div className="grid grid-cols-2 gap-2">
        <div className="h-16 rounded-xl bg-slate-800" />
        <div className="h-16 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}
