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
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
    sentimentStats: { positive: 0, neutral: 0, negative: 0 },
  });

  // ── Ambil insight dari DATABASE (bukan generate) ──
  const fetchInsightFromDB = useCallback(async (productId: string) => {
    if (!productId) return;
    setLoading(true);
    setInsight(null);
    try {
      const data = await safeFetch<InsightResponse>(
        `/api/insights/${productId}`,
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
          confidence: null,
          confidence_context: { status: "unavailable", reason: "not_generated", label: "Belum tersedia", message: "Generate insight untuk menghitung confidence dari Validation WAPE.", color: "gray" },
          modelVersion: "prophet",
          freq: "D",
        },
      );
      if (data.summary || data.executive_summary) setInsight(data);
    } catch (error) {
      console.error("Gagal fetch insight dari DB:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Generate ulang Insight dari hasil Forecasting V2 yang sudah tersimpan ──
  const regenerateInsight = useCallback(
    async (productId: string) => {
      if (!productId) return;
      setGenerating(true);
      try {
        const response = await fetch(`/api/insights/${encodeURIComponent(productId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frequency: "D" }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || "Gagal membuat Insight");
        }
        await fetchInsightFromDB(productId);
      } catch (error) {
        console.error("Gagal generate insight:", error);
      } finally {
        setGenerating(false);
      }
    },
    [fetchInsightFromDB],
  );

  // ── Initial load data ──
  useEffect(() => {
    const loadInitialData = async () => {
      const productData = await safeFetch<Product[]>("/api/products", []);
      const analytics = productData.length > 0
        ? await safeFetch<DashboardAnalyticsResponse>(
            `/api/dashboard-analytics?productId=${encodeURIComponent(productData[0].id)}`,
            {
              totalReviews: 0,
              totalProducts: productData.length,
              avgRating: 0,
              sentimentStats: { positive: 0, neutral: 0, negative: 0 },
            },
          )
        : {
            totalReviews: 0,
            totalProducts: 0,
            avgRating: 0,
            sentimentStats: { positive: 0, neutral: 0, negative: 0 },
          };

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

  // ── Saat produk berubah, ambil insight dari DB ──
  useEffect(() => {
    if (selectedProduct) {
      fetchInsightFromDB(selectedProduct);
    }
  }, [selectedProduct, fetchInsightFromDB]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
            AI Decision Support
          </p>
          <h1 className="text-2xl font-bold text-foreground">AI Insight</h1>
          <p className="text-sm text-muted mt-2 max-w-lg">
            Analisis kesehatan produk, risiko, isu dominan, dan rekomendasi
            bisnis berbasis rule engine dan LLM.
          </p>
        </div>

        {/* Tombol Generate Ulang */}
        <button
          onClick={() => regenerateInsight(selectedProduct)}
          disabled={generating || loading || !selectedProduct}
          className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
            generating || loading || !selectedProduct
              ? "bg-card text-muted cursor-not-allowed"
              : "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
          }`}
        >
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
          {generating ? "Memproses..." : "Generate Ulang"}
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
