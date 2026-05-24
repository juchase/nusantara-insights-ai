// components/dashboard/InsightPanel.tsx

"use client";

import { InsightResponse } from "@/types/insight";

interface Props {
  insight: InsightResponse | null;
  stats: any;
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

export default function InsightPanel({ insight, stats, loading }: Props) {
  // METRICS ROW
  const metrics = [
    {
      label: "Total Ulasan",
      value: stats.totalReviews.toLocaleString("id-ID"),
      badge: "Live",
    },
    { label: "Sentimen Positif", value: `${stats.sentimentStats.positive}%` },
    { label: "Total Produk", value: stats.totalProducts.toString() },
  ];

  return (
    <div className="space-y-4 py-4">
      {/* METRICS GRID */}
      <div className="grid grid-cols-3 gap-8">
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--color-background-secondary, #fff)",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#6b7280",
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              {m.label}
            </p>
            <div className="flex items-end gap-2">
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: "#111827",
                  lineHeight: 1,
                }}
              >
                {loading ? "—" : m.value}
              </span>
              {m.badge && (
                <span
                  style={{
                    fontSize: 11,
                    background: "#EAF3DE",
                    color: "#3B6D11",
                    padding: "2px 8px",
                    borderRadius: 20,
                    fontWeight: 500,
                    marginBottom: 1,
                  }}
                >
                  {m.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* INSIGHTS + RECOMMENDATIONS — 2 column */}
      {!loading && insight && (
        <div className="grid grid-cols-2 gap-8">
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
                  className="flex items-start gap-3"
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
                  <div style={{ flex: 1 }}>
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
                  <p
                    style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}
                  >
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
