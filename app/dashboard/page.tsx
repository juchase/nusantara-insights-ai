"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ChevronDown, Radio, Sparkles } from "lucide-react";
import { InsightResponse } from "@/types/insight";

import Topbar from "@/components/dashboard/Topbar";
import StatsCard from "@/components/dashboard/StatsCard";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import KeywordMap from "@/components/dashboard/KeywordMap";
import ChartSection from "@/components/dashboard/ChartSection";
import ForecastChart from "@/components/dashboard/ForecastChart";
import InsightPanel from "@/components/dashboard/InsightPanel";

import { mergeForecastData } from "@/lib/mergeForecastData";

type Product = {
  id: string;
  name: string;
};

type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
};

type SentimentTimelinePoint = {
  date: string;
  total: number;
};

type DashboardAnalyticsResponse = {
  topKeywords?: [string, number][];
  chartData?: SentimentTimelinePoint[];
  totalReviews?: number;
  totalProducts?: number;
  avgRating?: number;
  sentimentStats?: {
    positive: number;
    neutral: number;
    negative: number;
  };
};

export default function DashboardPage() {
  // =============================
  // STATES
  // =============================

  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<SentimentTimelinePoint[]>([]);
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);

  const [growth, setGrowth] = useState(0);

  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);

  const [authLoading, setAuthLoading] = useState(true);

  const [dataLoading, setDataLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);

  // SINGLE SOURCE OF TRUTH
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // INSIGHT
  const [insight, setInsight] = useState<InsightResponse | null>(null);

  const [insightLoading, setInsightLoading] = useState(false);

  const [confidence, setConfidence] = useState(0);

  // STATS
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
    sentimentStats: {
      positive: 0,
      neutral: 0,
      negative: 0,
    },
  });

  const router = useRouter();

  // =============================
  // AUTH
  // =============================

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");

        if (!res.ok) {
          return router.push("/login");
        }

        const data = await res.json();

        setUser(data.user);
        await res.json();
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // =============================
  // FETCH PRODUCTS
  // =============================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");

        const data = (await res.json()) as Product[];

        setProducts(data);

        // AUTO SELECT FIRST PRODUCT
        if (data.length > 0) {
          setSelectedProduct(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, []);

  // =============================
  // FETCH ANALYTICS
  // =============================

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

          sentimentStats: data.sentimentStats || {
            positive: 0,
            neutral: 0,
            negative: 0,
          },

          avgRating: Math.round((data.avgRating || 0) * 10) / 10,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // =============================
  // FORECAST FLOW
  // =============================

  useEffect(() => {
    if (!selectedProduct) return;

    const fetchForecast = async () => {
      try {
        // TRIGGER AI
        const predictRes = await fetch(
          `http://localhost:8000/predict-demand/${selectedProduct}`,
          {
            method: "POST",
          },
        );

        const predictData = await predictRes.json();

        setConfidence(predictData.confidence || 0);

        // delay kecil agar DB selesai commit
        await new Promise((resolve) => setTimeout(resolve, 300));

        // FETCH FROM DB
        const res = await fetch(`/api/predictions/${selectedProduct}`);

        const result = await res.json();

        const merged = mergeForecastData(
          result.sales,
          result.predictions,
        ) as ForecastPoint[];

        setForecastData(merged);

        setGrowth(calculateGrowth(merged));
      } catch (err) {
        console.error(err);
      }
    };

    fetchForecast();
  }, [selectedProduct]);

  // =============================
  // FETCH INSIGHT
  // =============================

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

  // =============================
  // GROWTH
  // =============================

  function calculateGrowth(data: ForecastPoint[]) {
    const actual = data.filter((d) => d.actual).map((d) => d.actual);

    const predicted = data.filter((d) => d.predicted).map((d) => d.predicted);

    if (!actual.length || !predicted.length) {
      return 0;
    }

    const lastActual = actual[actual.length - 1];

    const avgPred = predicted.reduce((a, b) => a + b, 0) / predicted.length;

    return Number((((avgPred - lastActual) / lastActual) * 100).toFixed(1));
  }

  // =============================
  // LOADING
  // =============================

  if (authLoading || dataLoading) {
    return <div className="p-10">Loading...</div>;
  }

  // =============================
  // UI
  // =============================

  return (
    <div className="space-y-8">
      <Topbar />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
            <Sparkles size={14} />
            AI Business Intelligence
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Executive Summary
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor sentiment, demand, complaints, and AI recommendations for
              Indonesian UMKM products.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
              <Radio size={14} className="animate-pulse" />
              Realtime AI analysis
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
              {stats.totalReviews.toLocaleString()} reviews analyzed
            </span>
          </div>
        </div>

        {/* PRODUCT SELECT */}
        <div
          className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
          style={{
            maxWidth: 520,
            borderRadius: 24,
            padding: 16,
            boxShadow: "0 14px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Active Product
          </label>

          <div className="relative">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              style={{
                minHeight: 48,
                padding: "0 40px 0 16px",
                borderRadius: 14,
                borderColor: "#e2e8f0",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Forecast and AI insight refresh automatically after selection.
          </p>
        </div>
      </div>

      {/* INSIGHT */}
      <InsightPanel insight={insight} loading={insightLoading} />

      {/* STATS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatsCard
          title="Total Reviews"
          value={stats.totalReviews.toString()}
        />

        <StatsCard
          title="Positive Sentiment"
          value={`${stats.sentimentStats.positive}%`}
        />

        <StatsCard
          title="Total Products"
          value={stats.totalProducts.toString()}
        />
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* CHART */}
        <div className="lg:col-span-8">
          <ChartSection data={chartData} />
        </div>

        {/* FORECAST */}
        <div className="lg:col-span-4">
          <ForecastChart
            data={forecastData}
            growth={growth}
            confidence={confidence}
          />
        </div>

        {/* COMPLAINTS */}
        <div className="lg:col-span-5">
          <ComplaintsCard data={topKeywords.slice(0, 5)} />
        </div>

        {/* KEYWORD MAP */}
        <div className="lg:col-span-7">
          <KeywordMap data={topKeywords.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}
