// components/dashboard/RiskOverview.tsx

"use client";

import { InsightResponse } from "@/types/insight";
import { Check, Minus, TrendingDown, TrendingUp, X } from "lucide-react";

interface Props {
  insight: InsightResponse | null;
  loading: boolean;
}

const RISK_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  high:   { bg: "#FCEBEB", color: "#A32D2D", label: "Tinggi" },
  medium: { bg: "#FAEEDA", color: "#854F0B", label: "Sedang" },
  low:    { bg: "#EAF3DE", color: "#3B6D11", label: "Rendah" },
};

export default function RiskOverview({ insight, loading }: Props) {
  if (loading || !insight) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
        <p style={{ fontSize: 13, fontWeight: 500 }}>Risk Overview</p>
        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Memuat data...</p>
      </div>
    );
  }

  const risk    = RISK_STYLE[insight.risk_level ?? "low"];
  const trend   = insight.metrics?.forecast_trend ?? "stable";
  const llmUsed = insight.llm_used;

  const rows = [
    {
      label: "Risk Level",
      value: (
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: risk.bg, color: risk.color }}>
          {risk.label}
        </span>
      ),
    },
    {
      label: "Isu Dominan",
      value: (
        <span style={{ fontSize: 12, fontWeight: 500, color: "#111827", textTransform: "capitalize" }}>
          {insight.metrics?.top_keyword ?? insight.dominant_issue ?? "—"}
        </span>
      ),
    },
    {
      label: "Demand Trend",
      value: trend === "up" ? (
        <span style={{ fontSize: 12, color: "#3B6D11", display: "flex", alignItems: "center", gap: 4 }}>
          <TrendingUp size={14} /> Meningkat
        </span>
      ) : trend === "down" ? (
        <span style={{ fontSize: 12, color: "#A32D2D", display: "flex", alignItems: "center", gap: 4 }}>
          <TrendingDown size={14} /> Menurun
        </span>
      ) : (
        <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
          <Minus size={14} /> Stabil
        </span>
      ),
    },
    {
      label: "LLM Digunakan",
      value: llmUsed ? (
        <span style={{ fontSize: 12, color: "#3C3489", display: "flex", alignItems: "center", gap: 4 }}>
          <Check size={14} /> Ya (Qwen2.5)
        </span>
      ) : (
        <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
          <X size={14} /> Tidak (Fallback)
        </span>
      ),
    },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Risk Overview</p>
      <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 14 }}>Status keseluruhan produk</p>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px" }}
          >
            <span style={{ fontSize: 12, color: "#6b7280" }}>{row.label}</span>
            {row.value}
          </div>
        ))}
      </div>
    </div>
  );
}
