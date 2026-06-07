// app/dashboard/insight/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react"; // ← tambah useCallback
import InsightCard from "@/components/dashboard/InsightCard";
import InsightPanel from "@/components/dashboard/InsightPanel";
import RiskOverview from "@/components/dashboard/RiskOverview";
import SentimentDistribution from "@/components/dashboard/SentimentDistribution";
import SentimentTrendCard from "@/components/dashboard/SentimentTrendCard";
import { safeFetch } from "@/lib/safe-fetch";
import { InsightResponse } from "@/types/insight";
import { RefreshCw } from "lucide-react";

type Product = { id: string; name: string };
type DashboardAnalyticsResponse = {
  totalReviews?: number;
  totalProducts?: number;
  avgRating?: number;
  sentimentStats?: { positive: number; neutral: number; negative: number };
};

export default function InsightPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
    sentimentStats: { positive: 0, neutral: 0, negative: 0 },
  });

  // ✅ Definisikan fetchInsight sebagai useCallback
  const fetchInsight = useCallback(
    async (productId?: string) => {
      const id = productId ?? selectedProduct;
      if (!id) return;

      setLoading(true);
      setInsight(null);

      const data = await safeFetch<InsightResponse>(
        `http://127.0.0.1:8000/generate-insight/${id}`,
        {
          executive_summary: "",
          summary: "",
          health_score: 0,
          health_label: "",
          insights: [],
          recommendations: [],
          dominant_issue: "",
          risk_level: "low",
          llm_used: false,
          metrics: undefined,
        },
      );

      if (data.summary || data.executive_summary) setInsight(data);
      setLoading(false);
    },
    [selectedProduct],
  );

  // Load produk + analytics sekali
  useEffect(() => {
    const loadInitialData = async () => {
      const [productData, analytics] = await Promise.all([
        safeFetch<Product[]>("/api/products", []),
        safeFetch<DashboardAnalyticsResponse>("/api/dashboard-analytics", {
          totalReviews: 0,
          totalProducts: 0,
          avgRating: 0,
          sentimentStats: { positive: 0, neutral: 0, negative: 0 },
        }),
      ]);

      setProducts(productData);
      if (productData.length > 0) setSelectedProduct(productData[0].id);

      setStats({
        totalReviews: analytics.totalReviews || 0,
        totalProducts: analytics.totalProducts || 0,
        avgRating: Math.round((analytics.avgRating || 0) * 10) / 10,
        sentimentStats: analytics.sentimentStats || {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
      });
    };
    loadInitialData();
  }, []);

  // Auto-fetch saat produk berubah
  useEffect(() => {
    if (!selectedProduct) return;
    fetchInsight(selectedProduct);
  }, [selectedProduct]); // ← tidak include fetchInsight untuk hindari infinite loop

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#4f46e5",
              marginBottom: 4,
            }}
          >
            AI Decision Support
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#111827" }}>
            AI Insight
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 6,
              maxWidth: 560,
            }}
          >
            Analisis kesehatan produk, risiko, isu dominan, dan rekomendasi
            bisnis berbasis rule engine dan LLM.
          </p>
        </div>

        {/* ✅ Tombol Generate Ulang — memanggil fetchInsight() */}
        <button
          onClick={() => fetchInsight()}
          disabled={loading || !selectedProduct}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 36,
            padding: "0 16px",
            flexShrink: 0,
            background: loading ? "#f3f4f6" : "rgba(127,119,221,0.15)",
            color: loading ? "#9ca3af" : "#7F77DD",
            border: `1px solid ${loading ? "#e5e7eb" : "rgba(127,119,221,0.3)"}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          <RefreshCw
            size={14}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
          {loading ? "Memproses..." : "Generate Ulang"}
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <InsightCard
        insight={insight}
        products={products}
        selectedProduct={selectedProduct}
        onProductChange={setSelectedProduct}
        loading={loading}
      />

      <InsightPanel insight={insight} stats={stats} loading={loading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SentimentDistribution
            positive={stats.sentimentStats.positive}
            neutral={stats.sentimentStats.neutral}
            negative={stats.sentimentStats.negative}
          />
          <SentimentTrendCard
            data={insight?.sentiment_trend}
            loading={loading}
          />
        </div>
        <RiskOverview insight={insight} loading={loading} />
      </div>
    </div>
  );
}
