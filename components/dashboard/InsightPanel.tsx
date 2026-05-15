"use client";

interface InsightPanelProps {
  insight: string;
}

export default function InsightPanel({ insight }: InsightPanelProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-2">🤖 AI Insight</h2>

      <p className="text-gray-700">{insight}</p>
    </div>
  );
}
