export default function SalesChartSkeleton() {
  return (
    <div className="min-w-0 animate-pulse rounded-2xl border border-gray-200 bg-white px-4 py-5 sm:px-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="mb-2 h-3 w-44 rounded bg-gray-200" />
          <div className="h-2.5 w-56 rounded bg-gray-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-2.5 w-14 rounded bg-gray-100" />
          <div className="h-2.5 w-14 rounded bg-gray-100" />
        </div>
      </div>

      <div className="h-[260px] rounded-lg bg-gray-50" />

      <div className="mt-3 h-8 rounded-lg bg-gray-50" />
    </div>
  );
}
