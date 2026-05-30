// components/dashboard/ProductRanking.tsx
"use client";

import { useEffect, useState } from "react";
import { Trophy, AlertTriangle, MessageSquareWarning } from "lucide-react";

interface ProductRank {
  id: string;
  name: string;
  totalReviews: number;
  positiveRate: number;
  negativeRate: number;
  healthScore: number;
  riskLevel: string;
  dominantIssue: string;
}

interface RankingData {
  best: ProductRank | null;
  worst: ProductRank | null;
  mostComplaints: ProductRank | null;
  all: ProductRank[];
  total: number;
}

const RISK_STYLE: Record<string, { bg: string; color: string; label: string }> =
  {
    low: { bg: "#EAF3DE", color: "#3B6D11", label: "Rendah" },
    medium: { bg: "#FAEEDA", color: "#854F0B", label: "Sedang" },
    high: { bg: "#FCEBEB", color: "#A32D2D", label: "Tinggi" },
    unknown: { bg: "#f3f4f6", color: "#6b7280", label: "—" },
  };

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "#1D9E75" : value >= 45 ? "#EF9F27" : "#E24B4A";
  return (
    <div
      style={{
        flex: 1,
        height: 6,
        background: "#f3f4f6",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: 3,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

function TopCard({
  icon,
  label,
  iconColor,
  iconBg,
  product,
}: {
  icon: React.ReactNode;
  label: string;
  iconColor: string;
  iconBg: string;
  product: ProductRank | null;
}) {
  if (!product) return null;
  const risk = RISK_STYLE[product.riskLevel] ?? RISK_STYLE.unknown;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
          }}
        >
          {icon}
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </p>
      </div>

      {/* Product name */}
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#111827",
          marginBottom: 10,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {product.name}
      </p>

      {/* Health score bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{ fontSize: 11, color: "#6b7280", width: 64, flexShrink: 0 }}
        >
          Health
        </span>
        <ScoreBar value={product.healthScore} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#111827",
            width: 32,
            textAlign: "right",
          }}
        >
          {product.healthScore}
        </span>
      </div>

      {/* Sentiment bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{ fontSize: 11, color: "#6b7280", width: 64, flexShrink: 0 }}
        >
          Positif
        </span>
        <div
          style={{
            flex: 1,
            height: 6,
            background: "#f3f4f6",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${product.positiveRate}%`,
              background: "#1D9E75",
              borderRadius: 3,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#111827",
            width: 32,
            textAlign: "right",
          }}
        >
          {product.positiveRate}%
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {product.totalReviews} ulasan
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: 20,
            background: risk.bg,
            color: risk.color,
          }}
        >
          {risk.label}
        </span>
      </div>
    </div>
  );
}

export default function ProductRanking() {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/api/product-ranking")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            height: 14,
            width: 160,
            background: "#f3f4f6",
            borderRadius: 4,
            marginBottom: 16,
          }}
          className="animate-pulse"
        />
        <div
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ height: 140, background: "#f9fafb", borderRadius: 10 }}
              className="animate-pulse"
            />
          ))}
        </div>
      </div>
    );

  if (!data || data.total === 0) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      {/* Header */}
      <div
        className="flex-col gap-3 sm:flex-row sm:items-center"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>
            Performa Produk
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Perbandingan {data.total} produk berdasarkan health score
          </p>
        </div>
        {data.total > 3 && (
          <button
            onClick={() => setShowAll((p) => !p)}
            style={{
              fontSize: 12,
              color: "#4f46e5",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {showAll ? "Sembunyikan" : `Lihat semua (${data.total})`}
          </button>
        )}
      </div>

      {/* Top 3 cards */}
      <div
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
        style={{
          marginBottom: showAll ? 16 : 0,
        }}
      >
        <TopCard
          label="Terbaik"
          icon={<Trophy size={14} />}
          iconColor="#3B6D11"
          iconBg="#EAF3DE"
          product={data.best}
        />
        <TopCard
          label="Perlu Perhatian"
          icon={<AlertTriangle size={14} />}
          iconColor="#854F0B"
          iconBg="#FAEEDA"
          product={data.worst}
        />
        <TopCard
          label="Keluhan Terbanyak"
          icon={<MessageSquareWarning size={14} />}
          iconColor="#A32D2D"
          iconBg="#FCEBEB"
          product={data.mostComplaints}
        />
      </div>

      {/* Full ranking table — toggle */}
      {showAll && (
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
          <div className="overflow-x-auto">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minWidth: 560,
              }}
            >
              {data.all.map((p, i) => {
                const risk = RISK_STYLE[p.riskLevel] ?? RISK_STYLE.unknown;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: i === 0 ? "#f9fafb" : "transparent",
                    }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: i < 3 ? "#4f46e5" : "#9ca3af",
                        width: 20,
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </span>

                    {/* Name */}
                    <span
                      style={{
                        fontSize: 13,
                        color: "#111827",
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.name}
                    </span>

                    {/* Health bar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        width: 140,
                      }}
                    >
                      <ScoreBar value={p.healthScore} />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#111827",
                          width: 28,
                          textAlign: "right",
                        }}
                      >
                        {p.healthScore}
                      </span>
                    </div>

                    {/* Positive rate */}
                    <span
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        width: 40,
                        textAlign: "right",
                      }}
                    >
                      {p.positiveRate}%
                    </span>

                    {/* Risk badge */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: risk.bg,
                        color: risk.color,
                        flexShrink: 0,
                        width: 56,
                        textAlign: "center",
                      }}
                    >
                      {risk.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
