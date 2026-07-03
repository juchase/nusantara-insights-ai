"use client";

import { InsightResponse } from "@/types/insight";
import InsightPanelSkeleton from "@/components/dashboard/skeleton/InsightPanelSkeleton";

interface Props {
  insight: InsightResponse | null;
  totalReviews: number;
  avgRating: number;
  totalProducts: number;
  loading: boolean;
}

const DOT_COLOR: Record<string, string> = {
  warning: "#EF9F27",
  positive: "#1D9E75",
  danger: "#E24B4A",
  opportunity: "#7F77DD",
  neutral: "#888780",
};

const PRIORITY_STYLE: Record<string, { background: string; color: string }> = {
  HIGH: { background: "#FCEBEB", color: "#A32D2D" },
  MEDIUM: { background: "#FAEEDA", color: "#854F0B" },
  LOW: { background: "#EAF3DE", color: "#3B6D11" },
};

export default function InsightPanel({ insight, loading }: Props) {
  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return <InsightPanelSkeleton />;
  }

  // ── EMPTY — sembunyikan komponen sepenuhnya, tidak ada data untuk ditampilkan ──
  if (
    !insight ||
    (insight.insights.length === 0 && insight.recommendations.length === 0)
  ) {
    return null;
  }

  // ── DATA ADA — render normal ────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Insights */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
          AI Insight Bisnis
        </p>
        <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 14 }}>
          Hasil analisis rule engine
        </p>
        <div className="flex flex-col gap-2">
          {insight.insights.map((item, i) => (
            <div
              key={i}
              className="flex min-w-0 flex-wrap items-start gap-3 sm:flex-nowrap"
              style={{
                padding: "10px 12px",
                border: "1px solid #f3f4f6",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 4,
                  background: DOT_COLOR[item.type] ?? "#888780",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#111827",
                    marginBottom: 2,
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    lineHeight: 1.5,
                  }}
                >
                  {item.description}
                </p>
              </div>
              <span
                style={{
                  ...PRIORITY_STYLE[item.priority],
                  fontSize: 9,
                  fontWeight: 500,
                  padding: "2px 6px",
                  borderRadius: 20,
                  flexShrink: 0,
                  alignSelf: "flex-start",
                }}
              >
                {item.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
          Rekomendasi Aksi
        </p>
        <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 14 }}>
          Berdasarkan analisis AI
        </p>
        <div className="flex flex-col gap-3">
          {insight.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "#EEEDFE",
                  color: "#3C3489",
                  fontSize: 10,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                {rec}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
