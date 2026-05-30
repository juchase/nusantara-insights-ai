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
      secondary: `${stats.sentimentStats.positive}% positif`,
      progress: stats.sentimentStats.positive,
      progressColor: "#1D9E75",
      icon: "💬",
    },
    {
      label: "Sentimen Positif",
      value: `${stats.sentimentStats.positive}%`,
      secondary: `${stats.sentimentStats.negative}% negatif`,
      progress: stats.sentimentStats.positive,
      progressColor:
        stats.sentimentStats.positive >= 50 ? "#1D9E75" : "#E24B4A",
      icon: "😊",
    },
    {
      label: "Total Produk",
      value: stats.totalProducts.toString(),
      secondary: "produk terdaftar",
      progress: null,
      icon: "📦",
    },
  ];

  return (
    <div className="space-y-4">
      {/* METRICS GRID */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            {/* Top row — label + icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                {m.label}
              </p>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
            </div>

            {/* Value */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 28,
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
                    marginBottom: 2,
                  }}
                >
                  {m.badge}
                </span>
              )}
            </div>

            {/* Progress bar — kalau ada */}
            {m.progress !== null && m.progress !== undefined && (
              <div
                style={{
                  height: 4,
                  background: "#f3f4f6",
                  borderRadius: 2,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${m.progress}%`,
                    background: m.progressColor,
                    borderRadius: 2,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            )}

            {/* Secondary info */}
            <p style={{ fontSize: 11, color: "#9ca3af" }}>
              {loading ? "—" : m.secondary}
            </p>
          </div>
        ))}
      </div>
      {/* INSIGHTS + RECOMMENDATIONS — 2 column */}
      {!loading && insight && (
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
