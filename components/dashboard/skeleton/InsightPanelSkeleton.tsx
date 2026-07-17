export default function InsightPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1].map((col) => (
        <div
          key={col}
          className="glass-card border border-border p-5 animate-pulse"
        >
          <div className="mb-1 h-3 w-28 rounded bg-card" />
          <div className="mb-4 h-2.5 w-36 rounded bg-card/60" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-card" />
                <div className="flex-1">
                  <div className="mb-2 h-2.5 w-3/4 rounded bg-card" />
                  <div className="h-2 w-full rounded bg-card/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
