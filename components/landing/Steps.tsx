"use client";

import { motion } from "framer-motion";
import { FileText, Cpu, Rocket, ArrowRight, Zap, Shield } from "lucide-react";
import Link from "next/link";

export default function StepsSection() {
  const steps = [
    {
      icon: <FileText size={24} />,
      title: "Upload Dataset",
      desc: "Upload file CSV berisi data ulasan dan penjualan produk kamu.",
      accent: "var(--color-primary)", // Emas
      bgGlow: "bg-primary/10",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.25)]",
    },
    {
      icon: <Cpu size={24} />,
      title: "Proses AI",
      desc: "Sistem menganalisis sentimen, mendeteksi pola, dan menjalankan prediksi secara otomatis.",
      accent: "var(--color-secondary)", // Zamrud
      bgGlow: "bg-secondary/10",
      glow: "shadow-[0_0_40px_rgba(0,155,119,0.3)]",
      isCenter: true,
    },
    {
      icon: <Rocket size={24} />,
      title: "Dapatkan Insight",
      desc: "Baca ringkasan eksekutif, rekomendasi aksi, dan prediksi permintaan di dashboard.",
      accent: "var(--color-tertiary)", // Indigo Sistem
      bgGlow: "bg-tertiary/10",
      glow: "shadow-[0_0_30px_rgba(127,119,221,0.25)]",
    },
  ];

  return (
    <section className="bg-background text-foreground rounded-t-[3.5rem] relative overflow-hidden flex flex-col justify-between pt-24 pb-12">
      {/* BACKGROUND DECOR */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-tertiary/20 blur-[100px] rounded-full" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex flex-col flex-1">
        {/* HEADER STEPS */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Tiga Langkah Menuju Kecerdasan Bisnis
          </h2>
          <p className="text-muted max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Integrasi mudah dan instan ke dalam alur kerja operasional bisnis
            harian UMKM kamu.
          </p>
        </div>

        {/* STEPS CONTENT */}
        <div className="relative mb-16 flex flex-col justify-center">
          {/* GARIS PENGHUBUNG — Emas gradasi */}
          <div className="absolute top-9 left-0 w-full justify-center pointer-events-none hidden md:flex">
            <div className="w-[60%] h-px bg-linear-to-r from-transparent via-primary to-transparent opacity-20" />
            <div className="absolute w-[60%] h-px bg-linear-to-r from-transparent via-primary to-transparent blur-[2px] opacity-40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 relative">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center group text-center"
              >
                {/* Lingkaran Ikon dengan Glassmorphism + Aksen Warna */}
                <motion.div
                  initial={step.isCenter ? { scale: 1 } : {}}
                  animate={step.isCenter ? { scale: [1, 1.04, 1] } : {}}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  style={{
                    borderColor: step.accent + "40", // border transparan 25%
                    boxShadow: step.glow,
                  }}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center relative z-20 transition-all duration-300 group-hover:scale-105 bg-card border-border backdrop-blur-sm`}
                >
                  <span style={{ color: step.accent }}>{step.icon}</span>
                </motion.div>

                {/* Teks Keterangan */}
                <div className="mt-6">
                  <h4
                    className="text-base md:text-lg font-bold mb-2 tracking-tight transition-colors duration-200"
                    style={{ color: step.accent }}
                  >
                    {step.title}
                  </h4>
                  <p className="text-muted text-xs md:text-sm leading-relaxed max-w-[260px] md:max-w-[280px] mx-auto font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IMPLEMENTASI SEKSI MIKRO-CTA (Emas + Dark Mode) */}
        <div className="my-8 mb-20 flex flex-col items-center text-center border-t border-border pt-16">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-4">
            Siap Mengubah Data Menjadi Keputusan Bisnis?
          </h3>
          <div className="flex flex-col items-center gap-3">
            <Link href="/register">
              <button className="btn-primary flex items-center gap-2">
                Coba Demo Gratis - 5 Menit Selesai
                <ArrowRight size={16} />
              </button>
            </Link>
            <div className="flex items-center gap-4 text-xs text-muted font-semibold mt-1">
              <span className="flex items-center gap-1">
                <Zap size={13} className="text-primary" /> Tanpa Kartu Kredit
              </span>
              <span className="flex items-center gap-1">
                <Shield size={13} className="text-primary" /> Privasi data
                terjaga
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER AREA */}
        <footer className="border-t border-border pt-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-black text-lg tracking-tight">
              <span className="text-primary">✦</span>
              <span className="bg-linear-to-r bg-clip-text text-transparent from-foreground to-muted">
                NusantaraInsight AI
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.15em] text-muted font-bold">
              <Link
                href="/privacy"
                className="hover:text-primary transition-colors"
              >
                Privasi
              </Link>
              <Link
                href="/terms"
                className="hover:text-primary transition-colors"
              >
                Ketentuan
              </Link>
              <Link
                href="/docs"
                className="hover:text-primary transition-colors"
              >
                Dokumentasi API
              </Link>
              <Link
                href="/security"
                className="hover:text-primary transition-colors"
              >
                Keamanan
              </Link>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 pt-2">
            <p className="text-[10px] text-muted uppercase tracking-wider font-medium text-center md:text-left">
              © {new Date().getFullYear()} NusantaraInsight AI. Hak Cipta
              Dilindungi Undang-Undang.
            </p>

            <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted">
                Sistem Aktif Lokal
              </span>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
