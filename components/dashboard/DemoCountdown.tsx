"use client";

import { useEffect, useState } from "react";

export default function DemoCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const expireAt = Number(localStorage.getItem("demoExpireAt"));

      if (!expireAt) return;

      const diff = expireAt - Date.now();

      if (diff <= 0) {
        localStorage.clear();

        window.location.href = "/";

        return;
      }

      const min = Math.floor(diff / 60000);

      const sec = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${min}:${sec.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>Demo Session {timeLeft}</div>;
}
