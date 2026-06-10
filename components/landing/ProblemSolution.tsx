"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

function StatCard({ title, desc }: { title: string; desc: string }) {
  return (
    // Meningkatkan kekokohan warna kartu agar teks putih sangat mudah dibaca di atas gambar latar belakang
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-slate-900/50 hover:border-white/20">
      <h3 className="text-base lg:text-lg font-black text-white mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-300 text-xs leading-relaxed font-medium">
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
    // Menggunakan py-24 untuk ritme scrolling vertikal landing page yang lebih seimbang dan lega
    <section className="py-24 bg-slate-50 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* SISI KIRI: Komparasi Masalah vs Solusi */}
        <div className="flex flex-col justify-center space-y-8 py-2">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Hentikan Tebak-tebakan. <br />
              <span className="bg-linear-to-r bg-clip-text text-transparent from-indigo-600 to-indigo-500">
                Mulai Berkembang.
              </span>
            </h2>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
              Tinggalkan cara lama yang menghabiskan waktu. Gunakan kecerdasan
              AI untuk memahami pelanggan dan mengambil keputusan bisnis yang
              tepat.
            </p>
          </div>

          <div className="space-y-4">
            {/* Cara Lama: Analisis Manual (Efek Hover Ditegaskan) */}
            <div className="group p-5 rounded-2xl bg-white border border-slate-200/80 transition-all duration-300 hover:border-red-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  <AlertCircle
                    className="text-slate-400 transition-colors duration-300 group-hover:text-red-500"
                    size={22}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-base transition-colors duration-300 group-hover:text-red-600">
                    Cara Lama: Analisis Manual
                  </h4>
                  <p className="text-slate-500 text-xs lg:text-sm leading-relaxed">
                    Membaca ratusan ulasan satu per satu itu lambat, tidak
                    akurat, dan rentan melewatkan pola keluhan penting dari
                    pelanggan.
                  </p>
                </div>
              </div>
            </div>

            {/* Cara Nusantara: Kecerdasan AI (Efek Hover Ditegaskan) */}
            <div className="group p-5 rounded-2xl bg-white border border-slate-200/80 transition-all duration-300 hover:border-emerald-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  <CheckCircle2
                    className="text-slate-400 transition-colors duration-300 group-hover:text-emerald-500"
                    size={22}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-base transition-colors duration-300 group-hover:text-emerald-600">
                    Cara Nusantara: Kecerdasan AI
                  </h4>
                  <p className="text-slate-500 text-xs lg:text-sm leading-relaxed">
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
        <div className="relative rounded-[2rem] overflow-hidden bg-[#0a0a0a] min-h-[440px] lg:h-[500px] flex items-center justify-center shadow-2xl shadow-indigo-100/50 border border-slate-800/20">
          {/* Gambar Latar Belakang Placeholder */}
          <div
            className="absolute inset-0 opacity-40 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
            style={{ backgroundImage: "url('/garuda_ai.png')" }}
          />

          {/* PERBAIKAN: Mengembalikan dari bg-linear-to-t ke bg-gradient-to-t standar v4 */}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />

          {/* Susunan Kartu Statistik Mengambang */}
          <div className="relative z-10 w-full p-6 lg:p-8 space-y-3 mt-auto">
            {stats.map((stat) => (
              <StatCard key={stat.title} title={stat.title} desc={stat.desc} />
            ))}
          </div>

          {/* Aksesori Dekorasi Digital (Live Status Indicator) */}
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-900/80 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Engine Live
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
