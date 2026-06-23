export default function SentimentDistributionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 h-3 w-32 rounded bg-gray-200" />
      <div className="mb-4 h-2.5 w-24 rounded bg-gray-100" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-2">
            <div className="h-2.5 w-12 flex-shrink-0 rounded bg-gray-200" />
            <div className="h-2 flex-1 rounded-full bg-gray-100" />
            <div className="h-2.5 w-8 flex-shrink-0 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
