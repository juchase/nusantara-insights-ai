"use client";

import { useEffect, useState, useCallback } from "react";
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

  const fetchInsight = useCallback(
    async (productId?: string) => {
      const id = productId ?? selectedProduct;
      if (!id) return;

      setLoading(true);
      setInsight(null);

      try {
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
            confidence: 0,
            confidence_context: null,
            modelVersion: "prophet",
            freq: "D",
          },
        );

        if (data.summary || data.executive_summary) setInsight(data);
      } catch (error) {
        console.error("Gagal fetch insight:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedProduct],
  );

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

  useEffect(() => {
    if (selectedProduct) {
      fetchInsight(selectedProduct);
    }
  }, [selectedProduct, fetchInsight]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B] mb-1">
            AI Decision Support
          </p>
          <h1 className="text-2xl font-bold text-white">AI Insight</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-lg">
            Analisis kesehatan produk, risiko, isu dominan, dan rekomendasi
            bisnis berbasis rule engine dan LLM.
          </p>
        </div>

        {/* Tombol Generate Ulang */}
        <button
          onClick={() => fetchInsight()}
          disabled={loading || !selectedProduct}
          className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
            loading || !selectedProduct
              ? "bg-[#1e293b] text-slate-500 cursor-not-allowed"
              : "bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/20"
          }`}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Memproses..." : "Generate Ulang"}
        </button>
      </div>

      <InsightCard
        insight={insight}
        products={products}
        selectedProduct={selectedProduct}
        onProductChange={setSelectedProduct}
        loading={loading}
      />

      <InsightPanel
        insight={insight}
        totalReviews={stats.totalReviews}
        avgRating={stats.avgRating}
        totalProducts={stats.totalProducts}
        loading={loading}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SentimentDistribution
            positive={stats.sentimentStats.positive}
            neutral={stats.sentimentStats.neutral}
            negative={stats.sentimentStats.negative}
            loading={loading}
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
