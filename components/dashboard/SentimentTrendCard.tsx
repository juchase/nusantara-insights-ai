// components/dashboard/SentimentTrendCard.tsx
"use client";

import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { SentimentTrend } from "@/types/insight";

const TREND_CONFIG = {
  improving: {
    color: "#1D9E75",
    bg: "#EAF3DE",
    icon: <TrendingUp size={14} />,
    arrow: "↑",
  },
  declining: {
    color: "#E24B4A",
    bg: "#FCEBEB",
    icon: <TrendingDown size={14} />,
    arrow: "↓",
  },
  stable: {
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: <Minus size={14} />,
    arrow: "→",
  },
  insufficient_data: {
    color: "#9ca3af",
    bg: "#f9fafb",
    icon: <Info size={14} />,
    arrow: "—",
  },
};

export default function SentimentTrendCard({
  data,
  loading,
}: {
  data?: SentimentTrend;
  loading?: boolean;
}) {
  // 1. Kondisi Loading
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
        <div
          style={{
            height: 12,
            width: 160,
            background: "#f3f4f6",
            borderRadius: 4,
            marginBottom: 12,
          }}
          className="animate-pulse"
        />
        <div
          style={{ height: 40, background: "#f9fafb", borderRadius: 8 }}
          className="animate-pulse"
        />
      </div>
    );
  }

  // 2. Ambil status dengan aman (ubah ke lowercase untuk menghindari salah ketik dari backend)
  const dataStatus = data?.status?.toLowerCase();

  // 3. Kondisi jika data TIDAK VALID atau statusnya 'insufficient_data'
  if (!data || dataStatus === "insufficient_data" || dataStatus !== "ok") {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Tren Sentimen
        </p>
        <p style={{ fontSize: 12, color: "#9ca3af" }}>
          {data?.message ?? "Belum ada data tren"}
        </p>
      </div>
    );
  }

  const cfg = TREND_CONFIG[data.trend] ?? TREND_CONFIG.stable;
  const delta = data.delta > 0 ? `+${data.delta}%` : `${data.delta}%`;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "16px 20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
            Tren Sentimen
          </p>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
            Periode awal vs periode akhir
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 20,
            background: cfg.bg,
            color: cfg.color,
          }}
        >
          {cfg.icon}
          {data.label}
        </span>
      </div>

      {/* Comparison visual */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          minWidth: 0, // ← tambah ini
          overflow: "hidden", // ← tambah ini
        }}
      >
        {/* Periode awal */}
        <div
          style={{
            flex: 1,
            minWidth: 0, // ← tambah ini
            background: "#f9fafb",
            borderRadius: 10,
            padding: "10px 10px", // ← kurangi padding horizontal
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: "#9ca3af",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Periode Awal
          </p>
          <p
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "#111827",
              lineHeight: 1,
            }}
          >
            {data.first_period_positive}%
          </p>
          {data.first_period_range && (
            <p
              style={{
                fontSize: 9,
                color: "#9ca3af",
                marginTop: 4,
                wordBreak: "break-word",
              }}
            >
              {data.first_period_range}
            </p>
          )}
          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
            {data.first_period_count} ulasan
          </p>
        </div>

        {/* Arrow + delta — lebar fixed */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            flexShrink: 0, // ← jangan dikecilkan
            width: 44, // ← lebar fixed
          }}
        >
          <span style={{ fontSize: 18, color: cfg.color }}>{cfg.arrow}</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: cfg.color }}>
            {delta}
          </span>
        </div>

        {/* Periode akhir */}
        <div
          style={{
            flex: 1,
            minWidth: 0, // ← tambah ini
            background: "#f9fafb",
            borderRadius: 10,
            padding: "10px 10px", // ← kurangi padding horizontal
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: "#9ca3af",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Periode Akhir
          </p>
          <p
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: cfg.color,
              lineHeight: 1,
            }}
          >
            {data.second_period_positive}%
          </p>
          {data.second_period_range && (
            <p
              style={{
                fontSize: 9,
                color: "#9ca3af",
                marginTop: 4,
                wordBreak: "break-word",
              }}
            >
              {data.second_period_range}
            </p>
          )}
          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
            {data.second_period_count} ulasan
          </p>
        </div>
      </div>
      {/* Message */}
      <div
        style={{
          background: cfg.bg,
          borderRadius: 8,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cfg.color,
            flexShrink: 0,
          }}
        />
        <p style={{ fontSize: 11, color: cfg.color, fontWeight: 500 }}>
          {data.message}
        </p>
      </div>
    </div>
  );
}
