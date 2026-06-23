export default function RiskOverviewSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 h-3 w-24 rounded bg-gray-200" />
      <div className="mb-4 h-2.5 w-36 rounded bg-gray-100" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
          >
            <div className="h-2.5 w-20 rounded bg-gray-200" />
            <div className="h-2.5 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
