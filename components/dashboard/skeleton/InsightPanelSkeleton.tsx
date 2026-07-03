export default function InsightPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1].map((col) => (
        <div
          key={col}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="mb-1 h-3 w-28 rounded bg-gray-200" />
          <div className="mb-4 h-2.5 w-36 rounded bg-gray-100" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
              >
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="mb-2 h-2.5 w-3/4 rounded bg-gray-200" />
                  <div className="h-2 w-full rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
