"use client";

import { InsightResponse } from "@/types/insight";
import { Sparkles } from "lucide-react";

interface Props {
  insight: InsightResponse | null;
  loading: boolean;
}

export default function InsightPanel({ insight, loading }: Props) {
  if (loading) {
    return (
      <div
        className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm shadow-emerald-100/70"
        style={{ borderRadius: 28, padding: 24 }}
      >
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">
              AI Smart Auto-Insight
            </p>
            <div className="h-5 w-80 max-w-full animate-pulse rounded-full bg-emerald-200/80" />
          </div>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        style={{ borderRadius: 28, padding: 24 }}
      >
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              AI Smart Auto-Insight
            </p>
            <p className="mt-1 text-slate-600">AI insight not available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm shadow-emerald-100/70"
      style={{
        borderRadius: 28,
        padding: 28,
        background:
          "linear-gradient(135deg, rgba(236,253,245,0.9) 0%, #ffffff 60%, #ffffff 100%)",
        boxShadow: "0 14px 32px rgba(16, 185, 129, 0.08)",
      }}
    >
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "minmax(0, 1fr) 170px" }}
      >
        <div className="flex gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Sparkles size={24} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">
              AI Smart Auto-Insight
            </p>
            <p className="mt-2 max-w-4xl text-lg leading-8 text-slate-950">
              {insight.summary}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/80 px-5 py-4 text-right shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Health Score
          </p>
          <p className="mt-1 text-4xl font-bold text-indigo-700">
            {insight.health_score}
          </p>
        </div>
      </div>
    </div>
  );
}
