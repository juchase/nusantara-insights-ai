export default function ComplaintsCardSkeleton() {
  return (
    <div className="glass-card border border-border p-5 animate-pulse">
      <div className="h-4 w-32 bg-card/50 rounded mb-4" />
      <div className="space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 h-3 bg-card/50 rounded" />
              <div className="flex-1 h-2 bg-card/50 rounded" />
              <div className="w-12 h-3 bg-card/50 rounded" />
            </div>
          ))}
      </div>
    </div>
  );
}
