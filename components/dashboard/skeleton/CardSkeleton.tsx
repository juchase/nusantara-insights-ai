"use client";

export default function CardSkeleton() {
  return (
    <div className="glass-card border border-border p-6 animate-pulse">
      <div className="h-4 w-32 bg-[#1e293b] rounded mb-6" />
      <div className="space-y-4">
        <div className="h-3 bg-[#1e293b]/60 rounded" />
        <div className="h-3 bg-[#1e293b]/60 rounded" />
        <div className="h-3 bg-[#1e293b]/60 rounded" />
      </div>
    </div>
  );
}
