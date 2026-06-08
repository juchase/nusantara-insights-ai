"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import SVGComponent from "../svg/logo";

export default function Hero() {
  return (
    <section className="pt-30 lg:pt-22 pb-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT */}
        <div className="max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold uppercase tracking-wider mb-6 border border-indigo-100">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Platform Kecerdasan Bisnis
          </div>

          {/* Logo + nama */}
          <div className="flex items-center gap-3 mb-5">
            <SVGComponent width={65} height={65} viewBox="0 0 200 200" />
            <div>
              <p className="text-[13px] font-medium text-gray-500 leading-none mb-1">
                NusantaraInsight AI
              </p>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">
                Platform Kecerdasan Bisnis
              </p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-2xl lg:text-4xl font-bold text-[#0f172a] leading-[1.1] mb-5 tracking-tight">
            Ubah Ulasan Pelanggan
            <br />
            Menjadi <span className="text-indigo-600">Keputusan Bisnis</span>
          </h1>

          {/* Subtext */}
          <p className="text-base text-gray-500 mb-8 max-w-md leading-relaxed">
            Analisis sentimen otomatis, prediksi permintaan, dan rekomendasi
            bisnis berbasis AI — dirancang khusus untuk UMKM Indonesia.
          </p>

          {/* Real stats — tidak overclaim */}
          <div className="flex gap-6 mb-8 pb-8 border-b border-gray-100">
            {[
              { value: "3 Model AI", desc: "Sentimen, Prediksi, Insight" },
              { value: "100% Lokal", desc: "Berjalan offline, data aman" },
              { value: "AI Hybrid", desc: "Rule Engine + LLM terintegrasi" },
            ].map((s) => (
              <div key={s.value}>
                <p className="text-[15px] font-semibold text-gray-900 mb-0.5">
                  {s.value}
                </p>
                <p className="text-[11px] text-gray-400 leading-snug">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-11 rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-[1.02] flex items-center gap-2">
                Mulai Analisis
                <ArrowRight size={15} />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                className="px-6 h-11 rounded-xl text-sm font-semibold border-gray-200 hover:bg-gray-50"
              >
                Masuk
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT — Dashboard preview + floating card */}
        <div className="relative hidden lg:block">
          <div className="bg-white p-2 rounded-[2rem] shadow-[0_15px_40px_rgba(79,70,229,0.12)] border border-indigo-50">
            <img
              src="/dashboard-preview.png"
              alt="Pratinjau Dashboard NusantaraInsight AI"
              className="rounded-[1.7rem] w-full h-auto object-cover max-h-[420px]"
            />
          </div>

          {/* Floating card — angka dari sistem nyata */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-gray-100 z-20 flex items-center gap-3"
          >
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight leading-none mb-1">
                AI Insight Aktif
              </p>
              <p className="text-[13px] font-bold text-slate-800 leading-none">
                Rule Engine + LLM
              </p>
            </div>
          </motion.div>

          {/* Decoration */}
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-indigo-100/30 blur-[60px] rounded-full -z-10" />
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-100/30 blur-2xl rounded-full -z-10" />
        </div>
      </div>
    </section>
  );
}
