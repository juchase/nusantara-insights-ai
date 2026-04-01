"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import InsightCard from "@/components/dashboard/InsightCard";
import StatsCard from "@/components/dashboard/StatsCard";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import KeywordMap from "@/components/dashboard/KeywordMap";
import ChartSection from "@/components/dashboard/ChartSection";
import {
  calculateSentiment,
  extractKeywords,
  generateChartData,
  generateInsight,
  calculateAvgRating,
} from "@/lib/analytics";
import { generateInsightAI } from "@/lib/ai-client";

export default function DashboardPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
  });

  const [sentimentStats, setSentimentStats] = useState({
    positive: 0,
    negative: 0,
    neutral: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);
  const [insightText, setInsightText] = useState("");

  // 🔐 AUTH
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return router.push("/login");

        setAuthLoading(false);
      } catch {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // 📊 FETCH + PROCESS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsRes, productsRes] = await Promise.all([
          fetch("/api/reviews"),
          fetch("/api/products"),
        ]);

        const reviews = (await reviewsRes.json()).data || [];
        const products = (await productsRes.json()).data || [];

        const sentiment = calculateSentiment(reviews);
        const keywords = extractKeywords(reviews);
        const chart = generateChartData(reviews);
        const insightRes = await generateInsightAI(sentiment, keywords);
        const insight = insightRes.insight;

        setSentimentStats(sentiment);
        setTopKeywords(keywords);
        setChartData(chart);
        setInsightText(insight);

        setStats({
          totalReviews: reviews.length,
          totalProducts: products.length,
          avgRating: calculateAvgRating(reviews),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  if (authLoading || dataLoading) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <>
      <Topbar />

      <div className="space-y-8">
        <InsightCard text={insightText} />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <StatsCard
            title="Total Reviews"
            value={stats.totalReviews.toString()}
          />
          <StatsCard
            title="Positive"
            value={sentimentStats.positive.toString()}
          />
          <StatsCard
            title="Negative"
            value={sentimentStats.negative.toString()}
          />
          <StatsCard
            title="Neutral"
            value={sentimentStats.neutral.toString()}
          />
          <StatsCard title="Products" value={stats.totalProducts.toString()} />
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <ChartSection data={chartData} />
          </div>

          <div className="lg:col-span-4">
            <div className="bg-indigo-600 text-white p-6 rounded-2xl">
              Forecast coming soon 🚀
            </div>
          </div>

          <div className="lg:col-span-5">
            <ComplaintsCard data={topKeywords} />
          </div>

          <div className="lg:col-span-7">
            <KeywordMap data={topKeywords} />
          </div>
        </div>
      </div>
    </>
  );
}
