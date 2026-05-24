// components/dashboard/InsightCard.tsx

"use client";

import { InsightResponse } from "@/types/insight";
import { Cpu, Sparkles } from "lucide-react";

interface Props {
  insight: InsightResponse | null;
  products: { id: string; name: string }[];
  selectedProduct: string;
  onProductChange: (value: string) => void;
  loading: boolean;
}

export default function InsightCard({
  insight,
  products,
  selectedProduct,
  onProductChange,
  loading,
}: Props) {
  const healthColor = (label: string) => {
    if (label === "Sangat Baik" || label === "Baik")
      return { background: "rgba(29,158,117,0.25)", color: "#5DCAA5" };
    if (label === "Perlu Perhatian")
      return { background: "rgba(239,159,39,0.25)", color: "#EF9F27" };
    return { background: "rgba(226,75,74,0.25)", color: "#E24B4A" };
  };

  return (
    <div className="rounded-2xl p-6 mt-6" style={{ background: "#1a1a2e" }}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="rounded-lg flex items-center justify-center shrink-0"
          style={{ width: 36, height: 36, background: "rgba(127,119,221,0.3)" }}
        >
          <Sparkles size={18} style={{ color: "#AFA9EC" }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            style={{
              fontSize: 10,
              color: "#7F77DD",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            AI Smart Auto-Insight
          </p>

          {loading ? (
            <div
              style={{
                height: 16,
                width: 320,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
              className="animate-pulse"
            />
          ) : (
            <p style={{ fontSize: 13, color: "#e8e8f0", lineHeight: 1.6 }}>
              {insight?.summary ?? "Insight tidak tersedia."}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(83,74,183,0.3)",
                color: "#AFA9EC",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Cpu size={11} /> Qwen2.5 Enhanced
            </span>
            {insight?.llm_used === false && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                (Rule engine fallback)
              </span>
            )}
          </div>
        </div>

        {/* Product selector */}
        <div
          className="shrink-0"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "12px 14px",
            minWidth: 200,
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}
          >
            Produk aktif
          </p>
          <select
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "6px 10px",
              color: "#fff",
              fontSize: 13,
              outline: "none",
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id} style={{ background: "#1a1a2e" }}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Health Score */}
        {insight && (
          <div className="shrink-0 text-right" style={{ minWidth: 80 }}>
            <p
              style={{
                fontSize: 32,
                fontWeight: 500,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {insight.health_score}/100
            </p>
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                marginTop: 2,
              }}
            >
              HEALTH SCORE
            </p>
            <span
              style={{
                ...healthColor(insight.health_label ?? ""),
                fontSize: 10,
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: 20,
                display: "inline-block",
                marginTop: 6,
              }}
            >
              {insight.health_label ?? "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
