"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<< ours
=======
import { ChevronDown, Radio, Sparkles } from "lucide-react";
import { InsightResponse } from "@/types/insight";
>>>>>>> theirs

import Topbar from "@/components/dashboard/Topbar";
import StatsCard from "@/components/dashboard/StatsCard";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import KeywordMap from "@/components/dashboard/KeywordMap";
import ChartSection from "@/components/dashboard/ChartSection";
import ForecastChart from "@/components/dashboard/ForecastChart";
import InsightPanel from "@/components/dashboard/InsightPanel";

import { mergeForecastData } from "@/lib/mergeForecastData";

<<<<<<< ours
=======
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

>>>>>>> theirs
export default function DashboardPage() {
  // =============================
  // STATES
  // =============================

<<<<<<< ours
  const [user, setUser] = useState<any>(null);

  const [chartData, setChartData] = useState<any[]>([]);

  const [forecastData, setForecastData] = useState<any[]>([]);
=======
  const [chartData, setChartData] = useState<SentimentTimelinePoint[]>([]);

  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
>>>>>>> theirs

  const [growth, setGrowth] = useState(0);

  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);

  const [authLoading, setAuthLoading] = useState(true);

  const [dataLoading, setDataLoading] = useState(true);

<<<<<<< ours
  const [products, setProducts] = useState<any[]>([]);
=======
  const [products, setProducts] = useState<Product[]>([]);
>>>>>>> theirs

  // SINGLE SOURCE OF TRUTH
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // INSIGHT
<<<<<<< ours
  const [insight, setInsight] = useState<any>(null);

  const [insightLoading, setInsightLoading] = useState(false);

=======
  const [insight, setInsight] = useState<InsightResponse | null>(null);

  const [insightLoading, setInsightLoading] = useState(false);

  const [confidence, setConfidence] = useState(0);

>>>>>>> theirs
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

<<<<<<< ours
        const data = await res.json();

        setUser(data.user);
=======
        await res.json();
>>>>>>> theirs
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

<<<<<<< ours
        const data = await res.json();
=======
        const data = (await res.json()) as Product[];
>>>>>>> theirs

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

<<<<<<< ours
        const data = await res.json();
=======
        const data = (await res.json()) as DashboardAnalyticsResponse;
>>>>>>> theirs

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
<<<<<<< ours
        await fetch(`http://localhost:8000/predict-demand/${selectedProduct}`, {
          method: "POST",
        });
=======
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
>>>>>>> theirs

        // FETCH FROM DB
        const res = await fetch(`/api/predictions/${selectedProduct}`);

        const result = await res.json();

<<<<<<< ours
        const merged = mergeForecastData(result.sales, result.predictions);
=======
        const merged = mergeForecastData(
          result.sales,
          result.predictions,
        ) as ForecastPoint[];
>>>>>>> theirs

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

<<<<<<< ours
        const data = await res.json();
=======
        const data = (await res.json()) as InsightResponse;
>>>>>>> theirs

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

<<<<<<< ours
  function calculateGrowth(data: any[]) {
=======
  function calculateGrowth(data: ForecastPoint[]) {
>>>>>>> theirs
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
<<<<<<< ours
    return <div className="p-10">Loading...</div>;
=======
    return (
      <div className="space-y-6">
        <Topbar />

        <div className="animate-pulse space-y-6">
          <div className="h-36 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-32 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
            <div className="h-32 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
            <div className="h-32 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
          </div>
          <div className="h-80 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200" />
        </div>
      </div>
    );
>>>>>>> theirs
  }

  // =============================
  // UI
  // =============================

  return (
<<<<<<< ours
    <>
      <Topbar />

      <div className="space-y-8">
        {/* PRODUCT SELECT */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Select Product:</label>

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* INSIGHT */}
        <InsightPanel insight={insight} loading={insightLoading} />

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CHART */}
          <div className="lg:col-span-8">
            <ChartSection data={chartData} />
          </div>

          {/* FORECAST */}
          <div className="lg:col-span-4">
            <ForecastChart data={forecastData} growth={growth} />
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
    </>
=======
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
>>>>>>> theirs
  );
}
