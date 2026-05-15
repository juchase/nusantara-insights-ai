"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import InsightCard from "@/components/dashboard/InsightCard";
import StatsCard from "@/components/dashboard/StatsCard";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import KeywordMap from "@/components/dashboard/KeywordMap";
import ChartSection from "@/components/dashboard/ChartSection";
import ForecastChart from "@/components/dashboard/ForecastChart";
import { mergeForecastData } from "@/lib/mergeForecastData";
import InsightPanel from "@/components/dashboard/InsightPanel";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [growth, setGrowth] = useState(0);
  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [insight, setInsight] = useState(null);

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

  // 🔐 AUTH
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        setProducts(data);

        if (data.length > 0) {
          setProductId(data[0].id); // default pilih pertama
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, []);

  // 📊 ANALYTICS
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/dashboard-analytics");
        const data = await res.json();

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

  // 📈 FORECAST FLOW (CLEAN)
  useEffect(() => {
    if (!productId) return;

    const fetchForecast = async () => {
      try {
        // trigger AI
        await fetch(`http://localhost:8000/predict-demand/${productId}`, {
          method: "POST",
        });

        // ambil dari DB
        const res = await fetch(`/api/predictions/${productId}`);
        const result = await res.json();

        const merged = mergeForecastData(result.sales, result.predictions);

        setForecastData(merged);
        setGrowth(calculateGrowth(merged));
      } catch (err) {
        console.error(err);
      }
    };

    fetchForecast();
  }, [productId]);

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch(
        `http://127.0.0.1:8000/generate-insight/${selectedProduct}`,
      );

      const data = await res.json();

      setInsight(data);
    }

    loadDashboard();
  }, [selectedProduct]);

  function calculateGrowth(data: any[]) {
    const actual = data.filter((d) => d.actual).map((d) => d.actual);
    const predicted = data.filter((d) => d.predicted).map((d) => d.predicted);

    if (!actual.length || !predicted.length) return 0;

    const lastActual = actual[actual.length - 1];
    const avgPred = predicted.reduce((a, b) => a + b, 0) / predicted.length;

    return Number((((avgPred - lastActual) / lastActual) * 100).toFixed(1));
  }

  if (authLoading || dataLoading) return <div className="p-10">Loading...</div>;

  return (
    <>
      <Topbar />

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

      <div className="space-y-8">
        <InsightPanel insight={insight?.final_insight ?? ""} />

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <ChartSection data={chartData} />
          </div>

          <div className="lg:col-span-4">
            <ForecastChart data={forecastData} growth={growth} />
          </div>

          <div className="lg:col-span-5">
            <ComplaintsCard data={topKeywords.slice(0, 5)} />
          </div>

          <div className="lg:col-span-7">
            <KeywordMap data={topKeywords.slice(0, 5)} />
          </div>
        </div>
      </div>
    </>
  );
}
