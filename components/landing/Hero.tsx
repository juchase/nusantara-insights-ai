"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export default function Hero() {
  return (
    // Mengurangi padding (pt-20 pb-12) agar lebih fit di satu layar
    <section className="p-12 mt-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT SIDE - Tighter spacing */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-4 border border-indigo-100">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            Next-Gen Intelligence
          </div>

          {/* Font size diturunkan sedikit agar tidak memakan banyak baris */}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] leading-[1.15] mb-4">
            NusantaraInsight AI: <br className="hidden lg:block" />
            Business Intelligence for UMKM
          </h1>

          <p className="text-base text-gray-500 mb-8 max-w-md leading-relaxed">
            Transform raw customer reviews into actionable growth. Forecast
            demand with precision and dominate your market.
          </p>

          <div className="flex gap-3">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-5 rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-105">
              Mulai Analisis →
            </Button>
            <Button
              variant="outline"
              className="px-6 py-5 rounded-xl text-sm font-semibold border-gray-200 hover:bg-gray-50"
            >
              View Demo
            </Button>
          </div>
        </div>

        {/* RIGHT SIDE - Compact Image & Premium Card */}
        <div className="relative group">
          <div className="bg-white p-2 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100">
            <img
              src="/dashboard-preview.png"
              alt="Dashboard"
              className="rounded-[1.7rem] w-full h-auto object-cover max-h-[400px]" // Membatasi tinggi gambar
            />

            {/* FLOATING CARD - More Compact & Premium */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-7 right-7 bg-gray-300/75 backdrop-blur-md p-3.5 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-white/50 z-20 flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center shadow-inner">
                <TrendingUp className="w-5 h-5 text-emerald-900" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">
                  Demand Growth
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-slate-900 leading-none">
                    +24.8%
                  </span>
                  <span className="text-[8px] font-bold text-emerald-500">
                    ▲ 12%
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Aksesoris dekorasi kecil */}
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100/40 blur-[50px] rounded-full -z-10" />
        </div>
      </div>
    </section>
  );
}
