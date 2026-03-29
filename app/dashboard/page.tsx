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
  const router = useRouter();

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

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <>
      <Topbar />

      <div className="space-y-8">
        <InsightCard />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Total Reviews" value="12,842" />
          <StatsCard title="Avg Sentiment" value="4.2" />
          <StatsCard title="Health Score" value="88" />
        </div>

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
