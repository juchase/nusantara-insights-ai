"use client";

export default function CardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border p-6 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded mb-6" />

      <div className="space-y-4">
        <div className="h-3 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
