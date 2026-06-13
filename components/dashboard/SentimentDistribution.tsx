// components/dashboard/SentimentDistribution.tsx

"use client";

interface Props {
  positive: number;
  neutral: number;
  negative: number;
  loading: boolean;
}

const BARS = [
  { label: "Positif", key: "positive" as const, color: "#1D9E75" },
  { label: "Netral", key: "neutral" as const, color: "#888780" },
  { label: "Negatif", key: "negative" as const, color: "#E24B4A" },
];

export default function SentimentDistribution({
  positive,
  neutral,
  negative,
  loading,
}: Props) {
  const data = { positive, neutral, negative };

  if (loading) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
          Distribusi Sentimen
        </p>
        <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 16 }}>
          30 hari terakhir
        </p>
        <div className="flex flex-col gap-3">
          {BARS.map((bar) => (
            <div key={bar.key} className="flex items-center gap-2">
              <span
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  width: 52,
                  flexShrink: 0,
                }}
              >
                {bar.label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "#f3f4f6",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: bar.color,
                    width: `0%`,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  width: 36,
                  textAlign: "right",
                  color: "#111827",
                  flexShrink: 0,
                }}
              >
                0%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (positive === 0 && neutral === 0 && negative === 0) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
          Distribusi Sentimen
        </p>
        <p style={{ fontSize: 11, color: "#6b7280" }}>
          Belum ada data sentimen
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "16px 20px",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
        Distribusi Sentimen
      </p>
      <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 16 }}>
        30 hari terakhir
      </p>

      <div className="flex flex-col gap-3">
        {BARS.map((bar) => (
          <div key={bar.key} className="flex items-center gap-2">
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
                width: 52,
                flexShrink: 0,
              }}
            >
              {bar.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 8,
                background: "#f3f4f6",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 4,
                  background: bar.color,
                  width: `${data[bar.key]}%`,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                width: 36,
                textAlign: "right",
                color: "#111827",
                flexShrink: 0,
              }}
            >
              {data[bar.key]}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
