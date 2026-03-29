"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import InsightCard from "@/components/dashboard/InsightCard";
import StatsCard from "@/components/dashboard/StatsCard";
import ComplaintsCard from "@/components/dashboard/ComplaintsCard";
import KeywordMap from "@/components/dashboard/KeywordMap";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
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
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // 📊 FETCH DATA (ALL IN ONE)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [reviewsRes, productsRes] = await Promise.all([
          fetch("/api/reviews"),
          fetch("/api/products"),
        ]);

        const reviewsJson = await reviewsRes.json();
        const productsJson = await productsRes.json();

        const reviews = reviewsJson.data || [];
        const products = productsJson.data || [];

        const totalReviews = reviews.length;
        const totalProducts = products.length;

        const avgRating =
          reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) /
          (reviews.length || 1);

        setStats({
          totalReviews,
          totalProducts,
          avgRating: Math.round(avgRating * 10) / 10,
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-10">Loading...</div>;

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
          <StatsCard title="Avg Sentiment" value={stats.avgRating.toString()} />
          <StatsCard
            title="Total Products"
            value={stats.totalProducts.toString()}
          />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <ComplaintsCard />
          </div>

          <div className="md:col-span-7">
            <KeywordMap />
          </div>
        </div>
      </div>
    </>
  );
}
