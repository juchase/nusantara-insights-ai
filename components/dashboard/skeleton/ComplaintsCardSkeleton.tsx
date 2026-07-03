export default function ComplaintsCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-1 h-3.5 w-32 rounded bg-gray-200" />
      <div className="mb-5 h-2.5 w-52 rounded bg-gray-100" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-2.5">
            <div className="h-2.5 w-16 flex-shrink-0 rounded bg-gray-200" />
            <div className="h-2 flex-1 rounded-full bg-gray-100" />
            <div className="h-2.5 w-12 flex-shrink-0 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
