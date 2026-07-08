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
    // ── PERBAIKAN UTAMA DI SINI ──
    <section className="relative w-full h-[calc(100vh-76px)] min-h-[580px] flex items-center justify-center overflow-hidden bg-background text-white">
      {/* Dekorasi Grid Linier AI di Latar Belakang (Mode Gelap) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-12 grid lg:grid-cols-2 gap-12 items-center z-10">
        {/* SISI KIRI: Konten Penawaran & CTA */}
        <div className="max-w-xl flex flex-col justify-center">
          {/* Badge Atas */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] font-bold uppercase tracking-wider mb-3 border border-[#F59E0B]/20 shadow-sm">
            <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-pulse" />
            Platform Kecerdasan Bisnis
          </div>

          {/* Logo + Nama Platform */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex size-15 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 shadow-[0_0_30px_rgba(245,158,11,0.18)]">
              <SVGComponent width={55} height={55} viewBox="0 0 200 200" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-300 leading-none mb-1">
                NusantaraInsight AI
              </p>
              <p className="text-[11px] text-[#F59E0B] uppercase tracking-widest font-bold">
                Platform Kecerdasan Bisnis
              </p>
            </div>
          </div>

          {/* Headline - DIPERKECIL */}
          <h1 className="text-3xl lg:text-5xl font-black text-white leading-[1.1] mb-3 tracking-tight">
            Ubah Ulasan Pelanggan
            <br />
            Menjadi{" "}
            <span className="bg-linear-to-r bg-clip-text text-transparent from-[#F59E0B] to-[#D97706]">
              Keputusan Bisnis
            </span>
          </h1>

          {/* Deskripsi */}
          <p className="text-sm lg:text-base text-slate-400 mb-4 max-w-md leading-relaxed">
            Analisis sentimen otomatis, prediksi permintaan, dan rekomendasi
            bisnis berbasis kecerdasan buatan dirancang khusus untuk kemajuan
            UMKM Indonesia.
          </p>

          {/* Parameter Keunggulan */}
          <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-white/5">
            {[
              { value: "3 Model AI", desc: "Sentimen, Prediksi, Insight" },
              { value: "Data Aman", desc: "Privasi dan kontrol penuh" },
              { value: "AI Hybrid", desc: "Rule Engine + LLM Enhancement" },
            ].map((s) => (
              <div
                key={s.value}
                className="border-l border-white/5 pl-3 first:border-0 first:pl-0"
              >
                <p className="text-xs lg:text-sm font-bold text-white mb-0.5">
                  {s.value}
                </p>
                <p className="text-[10px] text-slate-500 leading-snug font-medium">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Area CTA */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDemo}
                disabled={loading}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-background px-5 h-11 rounded-full text-xs font-bold shadow-lg shadow-[#F59E0B]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
                  className="px-5 h-11 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
                >
                  Dashboard
                </Button>
              </Link>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-xs text-red-400 font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            {/* Teks Penjamin Mikro */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium pl-0.5 pt-1">
              <span className="flex items-center gap-1">
                <Zap size={12} className="text-[#F59E0B]" /> Tanpa Kartu Kredit
              </span>
              <span className="flex items-center gap-1">
                <Shield size={12} className="text-[#F59E0B]" /> Privasi data
                terjaga
              </span>
            </div>
          </div>
        </div>

        {/* SISI KANAN: Pratinjau Dashboard */}
        <div className="relative hidden lg:block justify-self-center w-full max-w-[500px]">
          {/* Gelombang Gradasi Belakang */}
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[100px] z-0" />
          <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-[#009B77]/10 rounded-full blur-[80px] z-0" />

          <div className="relative bg-[#1e293b] p-2 rounded-4xl border border-white/5 shadow-2xl z-10 transition-transform duration-500 hover:scale-[1.01]">
            <img
              src="/dashboard-preview.png"
              alt="Pratinjau Dashboard NusantaraInsight AI"
              className="rounded-[1.7rem] w-full h-auto object-cover max-h-[360px] bg-background"
            />
          </div>

          {/* Kartu Mengambang Atas */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-3 -right-2 bg-[#1e293b]/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/5 z-20 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 bg-[#009B77]/15 border border-[#009B77]/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[#009B77]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                  AI Insight Aktif
                </p>
                <span className="w-1 h-1 bg-[#009B77] rounded-full animate-ping" />
              </div>
              <p className="text-xs font-black text-white leading-none">
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
            className="absolute -bottom-3 -left-4 bg-[#1e293b]/80 backdrop-blur-md p-2.5 px-3.5 rounded-xl shadow-lg border border-white/5 z-20 flex items-center gap-2"
          >
            <div className="w-6 h-6 bg-[#009B77]/10 rounded-lg flex items-center justify-center text-[#009B77]">
              <Sparkles size={12} />
            </div>
            <p className="text-[11px] font-bold text-white tracking-tight">
              Bahasa Indonesia Teroptimasi
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
