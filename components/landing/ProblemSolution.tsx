"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

function StatCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass-card flex flex-col p-4 shadow-sm transition-all duration-300 hover:bg-[#2d3449] hover:border-white/20">
      <h3 className="text-base lg:text-lg font-black text-white mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-400 text-xs leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
}

export default function ProblemSolution() {
  const stats = [
    {
      title: "3 Algoritma AI",
      desc: "Sentimen • Prediksi • Insight",
    },
    {
      title: "AI Hybrid",
      desc: "Rule Engine + LLM Enhancement",
    },
    {
      title: "Bahasa Indonesia",
      desc: "Dirancang khusus untuk UMKM Indonesia",
    },
  ];

  return (
    <section className="py-24 bg-background border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* SISI KIRI: Komparasi Masalah vs Solusi */}
        <div className="flex flex-col justify-center space-y-8 py-2">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.15]">
              Hentikan Tebak-tebakan. <br />
              <span className="bg-linear-to-r bg-clip-text text-transparent from-[#F59E0B] to-[#D97706]">
                Mulai Berkembang.
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Tinggalkan cara lama yang menghabiskan waktu. Gunakan kecerdasan
              AI untuk memahami pelanggan dan mengambil keputusan bisnis yang
              tepat.
            </p>
          </div>

          <div className="space-y-4">
            {/* Cara Lama: Analisis Manual */}
            <div className="group p-5 rounded-2xl glass border border-white/5 transition-all duration-300 hover:border-[#E24B4A]/40 hover:bg-[#1e293b]/80 hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  <AlertCircle
                    className="text-slate-500 transition-colors duration-300 group-hover:text-[#E24B4A]"
                    size={22}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1 text-base transition-colors duration-300 group-hover:text-[#E24B4A]">
                    Cara Lama: Analisis Manual
                  </h4>
                  <p className="text-slate-400 text-xs lg:text-sm leading-relaxed">
                    Membaca ratusan ulasan satu per satu itu lambat, tidak
                    akurat, dan rentan melewatkan pola keluhan penting dari
                    pelanggan.
                  </p>
                </div>
              </div>
            </div>

            {/* Cara Nusantara: Kecerdasan AI */}
            <div className="group p-5 rounded-2xl glass border border-white/5 transition-all duration-300 hover:border-[#009B77]/40 hover:bg-[#1e293b]/80 hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  <CheckCircle2
                    className="text-slate-500 transition-colors duration-300 group-hover:text-[#009B77]"
                    size={22}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1 text-base transition-colors duration-300 group-hover:text-[#009B77]">
                    Cara Nusantara: Kecerdasan AI
                  </h4>
                  <p className="text-slate-400 text-xs lg:text-sm leading-relaxed">
                    Ekstraksi sentimen otomatis dari ulasan pelanggan. Mengubah
                    data mentah menjadi peta strategi operasional bisnis yang
                    siap aksi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SISI KANAN: Kotak Ilustrasi Latar Belakang AI */}
        <div className="relative rounded-4xl overflow-hidden bg-background min-h-[440px] lg:h-[500px] flex items-center justify-center shadow-2xl shadow-black/40 border border-white/5">
          {/* Gambar Latar Belakang Placeholder */}
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
            style={{ backgroundImage: "url('/garuda_ai.png')" }}
          />

          {/* Gradasi Gelap (Menggunakan gradasi standar Tailwind) */}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />

          {/* Susunan Kartu Statistik Mengambang */}
          <div className="relative z-10 w-full p-6 lg:p-8 space-y-3 mt-auto">
            {stats.map((stat) => (
              <StatCard key={stat.title} title={stat.title} desc={stat.desc} />
            ))}
          </div>

          {/* Aksesori Dekorasi Digital (Live Status Indicator) */}
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-[#1e293b]/80 border border-white/5 px-2.5 py-1 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009B77] animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Engine Live
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
