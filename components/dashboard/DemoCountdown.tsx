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
    <div className="hidden sm:block glass border border-border px-4 py-1.5 rounded-full text-xs font-medium text-primary">
      Demo Session {timeLeft || "...loading"}
    </div>
  );
}
