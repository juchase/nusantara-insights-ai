"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import SVGComponent from "../svg/logo";

export default function Hero() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemo = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demo/spawn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Gagal memulai sesi demo.");
      }

      const data = await res.json();

      if (data.expiresAt) {
        // Ubah format tanggal ISO menjadi angka milidetik agar valid
        localStorage.setItem(
          "demoExpireAt",
          new Date(data.expiresAt).getTime().toString(),
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative w-full h-[calc(100vh-76px)] min-h-[580px] bg-white overflow-hidden flex items-center mt-10">
      {/* Dekorasi Grid Linier AI di Latar Belakang */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8 items-center z-10">
        {/* SISI KIRI: Konten Penawaran & CTA */}
        <div className="max-w-xl">
          {/* Badge Atas */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold uppercase tracking-wider mb-4 border border-indigo-100/80 shadow-sm">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Platform Kecerdasan Bisnis
          </div>

          {/* Logo + Nama Platform */}
          <div className="flex items-center gap-3 mb-4">
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
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-[1.15] mb-4 tracking-tight">
            Ubah Ulasan Pelanggan
            <br />
            Menjadi{" "}
            <span className="bg-linear-to-r bg-clip-text text-transparent from-indigo-600 to-indigo-500">
              Keputusan Bisnis
            </span>
          </h1>

          <p className="text-xs lg:text-sm text-slate-500 mb-6 max-w-md leading-relaxed">
            Analisis sentimen otomatis, prediksi permintaan, dan rekomendasi
            bisnis berbasis kecerdasan buatan — dirancang khusus untuk kemajuan
            UMKM Indonesia.
          </p>

          {/* Parameter Keunggulan */}
          <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-slate-100">
            {[
              { value: "3 Model AI", desc: "Sentimen, Prediksi, Insight" },
              { value: "Data Aman", desc: "Privasi dan kontrol penuh" },
              { value: "AI Hybrid", desc: "Rule Engine + LLM Enhancement" },
            ].map((s) => (
              <div
                key={s.value}
                className="border-l border-slate-100 pl-3 first:border-0 first:pl-0"
              >
                <p className="text-xs lg:text-sm font-bold text-slate-900 mb-0.5">
                  {s.value}
                </p>
                <p className="text-[10px] text-slate-400 leading-snug font-medium">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Area CTA */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDemo}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-11 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Membuat Sandbox...
                  </>
                ) : (
                  <>
                    Coba Demo Gratis - 5 Menit Selesai
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </Button>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="px-5 h-11 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  Dashboard
                </Button>
              </Link>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Teks Penjamin Mikro */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium pl-0.5">
              <span className="flex items-center gap-1">
                <Zap size={12} className="text-indigo-500" /> Tanpa Kartu Kredit
              </span>
              <span className="flex items-center gap-1">
                <Shield size={12} className="text-indigo-500" /> Privasi data
                terjaga
              </span>
            </div>
          </div>
        </div>

        {/* SISI KANAN: Pratinjau Dashboard */}
        <div className="relative hidden lg:block justify-self-center w-full max-w-[500px]">
          <div className="relative bg-white p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.15)] border border-indigo-50/50 z-10 transition-transform duration-500 hover:scale-[1.01]">
            <img
              src="/dashboard-preview.png"
              alt="Pratinjau Dashboard NusantaraInsight AI"
              className="rounded-[1.7rem] w-full h-auto object-cover max-h-[360px] bg-slate-50"
            />
          </div>

          {/* Kartu Mengambang Atas */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-3 -right-2 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100/80 z-20 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                  AI Insight Aktif
                </p>
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <p className="text-xs font-black text-slate-800 leading-none">
                Rule Engine + LLM
              </p>
            </div>
          </motion.div>

          {/* Kartu Mengambang Kiri Bawah */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -bottom-3 -left-4 bg-white/95 backdrop-blur-md p-2.5 px-3.5 rounded-xl shadow-lg border border-slate-100 z-20 flex items-center gap-2"
          >
            <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <Sparkles size={12} />
            </div>
            <p className="text-[11px] font-bold text-slate-800 tracking-tight">
              Bahasa Indonesia Teroptimasi
            </p>
          </motion.div>

          {/* Ornamen Lampu Gradien Belakang */}
          <div className="absolute -bottom-6 -left-6 w-44 h-44 bg-indigo-200/40 blur-[70px] rounded-full z-0" />
          <div className="absolute -top-6 -right-6 w-36 h-36 bg-cyan-200/30 blur-[50px] rounded-full z-0" />
        </div>
      </div>
    </section>
  );
}
