// app/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InsightResponse } from "@/types/insight";

import Topbar from "@/components/dashboard/Topbar";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import SalesChart from "@/components/dashboard/SalesChart";
import ForecastChart from "@/components/dashboard/ForecastChart";
import InsightCard from "@/components/dashboard/InsightCard";
import InsightPanel from "@/components/dashboard/InsightPanel";
import SentimentDistribution from "@/components/dashboard/SentimentDistribution";
import RiskOverview from "@/components/dashboard/RiskOverview";
import { mergeForecastData } from "@/lib/mergeForecastData";

type Product = { id: string; name: string };
type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
};
type SentimentTimelinePoint = { date: string; total: number };
type DashboardAnalyticsResponse = {
  topKeywords?: [string, number][];
  chartData?: SentimentTimelinePoint[];
  totalReviews?: number;
  totalProducts?: number;
  avgRating?: number;
  sentimentStats?: { positive: number; neutral: number; negative: number };
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<SentimentTimelinePoint[]>([]);
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [growth, setGrowth] = useState<number>(0);
  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
    sentimentStats: { positive: 0, neutral: 0, negative: 0 },
  });
  const [complaints, setComplaints] = useState<[string, number][]>([]);

  const router = useRouter();

  // AUTH
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return router.push("/login");
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = (await res.json()) as Product[];
        setProducts(data);
        if (data.length > 0) setSelectedProduct(data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  // ANALYTICS
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/dashboard-analytics");
        const data = (await res.json()) as DashboardAnalyticsResponse;
        setTopKeywords(data.topKeywords || []);
        setChartData(data.chartData || []);
        setStats({
          totalReviews: data.totalReviews || 0,
          totalProducts: data.totalProducts || 0,
          avgRating: Math.round((data.avgRating || 0) * 10) / 10,
          sentimentStats: data.sentimentStats || {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // FORECAST
  useEffect(() => {
    if (!selectedProduct) return;
    const fetchForecast = async () => {
      try {
        const predictRes = await fetch(
          `http://localhost:8000/predict-demand/${selectedProduct}`,
          { method: "POST" },
        );
        const predictData = await predictRes.json();
        setConfidence(predictData.confidence || 0);
        await new Promise((r) => setTimeout(r, 300));
        const res = await fetch(`/api/predictions/${selectedProduct}`);
        const result = await res.json();
        const merged = mergeForecastData(
          result.sales,
          result.predictions,
        ) as ForecastPoint[];
        setForecastData(merged);
        setGrowth(calculateGrowth(merged)); // ← fix: now returns number
      } catch (err) {
        console.error(err);
      }
    };
    fetchForecast();
  }, [selectedProduct]);

  // INSIGHT
  useEffect(() => {
    if (!selectedProduct) return;
    const fetchInsight = async () => {
      try {
        setInsightLoading(true);
        const res = await fetch(
          `http://127.0.0.1:8000/generate-insight/${selectedProduct}`,
        );
        const data = (await res.json()) as InsightResponse;
        setInsight(data);
      } catch (err) {
        console.error(err);
      } finally {
        setInsightLoading(false);
      }
    };
    fetchInsight();
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    const fetchComplaints = async () => {
      try {
        const res = await fetch(`/api/complaints/${selectedProduct}`);
        const data = await res.json();
        setComplaints(data.topKeywords || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComplaints();
  }, [selectedProduct]);

  // ✅ FIX di DashboardPage
  function calculateGrowth(data: ForecastPoint[]): number {
    const actual = data.filter((d) => d.actual).map((d) => d.actual ?? 0);
    const predicted = data
      .filter((d) => d.predicted)
      .map((d) => d.predicted ?? 0);
    if (!actual.length || !predicted.length) return 0;

    const lastActual = actual[actual.length - 1];
    const avgPredicted =
      predicted.reduce((a, b) => a + b, 0) / predicted.length;
    // ↑ rata-rata, bukan total

    if (lastActual === 0) return 0;
    return parseFloat(
      (((avgPredicted - lastActual) / lastActual) * 100).toFixed(1),
    );
  }

  if (authLoading || dataLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-gray-400">Memuat dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 px-6 pb-10 max-w-[1200px] mx-auto">
        {/* AI INSIGHT CARD — dark, full width */}
        <InsightCard
          insight={insight}
          products={products}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          loading={insightLoading}
        />

        {/* METRICS */}
        <InsightPanel
          insight={insight}
          stats={stats}
          loading={insightLoading}
        />

        {/* ROW A: Sentiment Distribution + Demand Forecast */}
        <div className="grid grid-cols-2 gap-4">
          <SentimentDistribution
            positive={stats.sentimentStats.positive}
            neutral={stats.sentimentStats.neutral}
            negative={stats.sentimentStats.negative}
          />
          <ForecastChart
            data={forecastData}
            growth={growth}
            confidence={confidence}
          />
        </div>

        {/* ROW B: Sentiment Timeline (full width) */}
        <SalesChart data={forecastData} />

        {/* ROW C: Complaints + Risk Overview */}
        <div className="grid grid-cols-2 gap-4">
          <ComplaintsCard data={complaints} />
          <RiskOverview insight={insight} loading={insightLoading} />
        </div>
      </div>
    </>
  );
}
