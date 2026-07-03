"use client";

import { useEffect, useState } from "react";

export default function DemoCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          console.log("✅ DemoCountdown: Role user =", data.user?.role);
          setIsDemo(data.user?.role === "DEMO");
        }
      } catch {
        setIsDemo(false);
      }
    };
    checkRole();
  }, []);

  useEffect(() => {
    if (!isDemo) return;

    console.log("⏳ DemoCountdown: Memulai timer...");

    const interval = setInterval(() => {
      const expireAtStr = localStorage.getItem("demoExpireAt");
      console.log("📦 demoExpireAt di localStorage:", expireAtStr);

      if (!expireAtStr) {
        setTimeLeft("");
        return;
      }

      // KONVERSI LANGSUNG KE ANGKA
      const expireAt = Number(expireAtStr);
      if (isNaN(expireAt)) {
        console.error("❌ demoExpireAt bukan angka yang valid:", expireAtStr);
        setTimeLeft("");
        return;
      }

      const diff = expireAt - Date.now();

      if (diff <= 0) {
        localStorage.removeItem("demoExpireAt");
        window.location.href = "/";
        return;
      }

      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${min}:${sec.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemo]);

  if (!isDemo) return null;

  return (
    <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hidden sm:block">
      Demo Session {timeLeft || "...loading"}
    </div>
  );
}
