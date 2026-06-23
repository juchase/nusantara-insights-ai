export default function SentimentTrendCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-1 h-3 w-24 rounded bg-gray-200" />
          <div className="h-2.5 w-32 rounded bg-gray-100" />
        </div>
        <div className="h-5 w-20 rounded-full bg-gray-100" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
          <div className="mx-auto mb-2 h-2 w-16 rounded bg-gray-200" />
          <div className="mx-auto h-5 w-12 rounded bg-gray-200" />
        </div>
        <div className="h-4 w-4 flex-shrink-0 rounded bg-gray-200" />
        <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
          <div className="mx-auto mb-2 h-2 w-16 rounded bg-gray-200" />
          <div className="mx-auto h-5 w-12 rounded bg-gray-200" />
        </div>
      </div>

      <div className="h-8 rounded-lg bg-gray-50" />
    </div>
  );
}
