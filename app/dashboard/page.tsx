"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import InsightCard from "@/components/dashboard/InsightCard";
import StatsCard from "@/components/dashboard/StatsCard";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import KeywordMap from "@/components/dashboard/KeywordMap";
import ChartSection from "@/components/dashboard/ChartSection";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

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

        if (!res.ok) {
          router.push("/login");
          return;
        }

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

  // 📊 FETCH ANALYTICS (PRODUCTION WAY)
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/dashboard-analytics");
        const data = await res.json();

        // 🔥 semua dari backend
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

  if (authLoading || dataLoading) return <div className="p-10">Loading...</div>;

  return (
    <>
      <Topbar />

      <div className="space-y-8">
        <InsightCard />

        {/* Stats */}
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

        {/* Bottom Section */}
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
