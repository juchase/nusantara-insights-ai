"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

function StatCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-sm">
      <h3 className="text-lg font-black text-white mb-1">{title}</h3>
      <p className="text-white/70 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

export default function ProblemSolution() {
  const stats = [
    {
      title: "3 Algoritma AI",
      desc: "Naive Bayes · Linear Regression · Rule Engine",
    },
    {
      title: "100% Offline",
      desc: "Data tidak keluar dari server lokal",
    },
    {
      title: "Bahasa Indonesia",
      desc: "Dioptimalkan untuk ulasan produk lokal",
    },
  ];

  return (
    // Menggunakan bg-slate-50 dan border-y agar terpisah jelas dari section putih
    <section className="py-18 bg-slate-50 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
        {/* LEFT SIDE - Content */}
        <div className="flex flex-col justify-center space-y-8 py-4">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Hentikan Tebak-tebakan. <br />
              <span className="text-indigo-600">Mulai Berkembang.</span>
            </h2>
            <p className="text-gray-500 max-w-md">
              Tinggalkan cara lama yang menghabiskan waktu. Gunakan kecerdasan
              AI untuk memahami pelanggan dan mengambil keputusan bisnis yang
              tepat.
            </p>
          </div>

          <div className="space-y-5">
            {/* Analisis Manual */}
            <div className="group p-5 rounded-2xl bg-white border border-slate-200 transition-all hover:border-red-100 shadow-sm hover:shadow-md">
              <div className="flex gap-4">
                <div className="mt-1">
                  <AlertCircle className="text-red-500" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-base">
                    Cara Lama: Analisis Manual
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Membaca ratusan ulasan satu per satu itu lambat, tidak
                    akurat, dan melewatkan pola penting.
                  </p>
                </div>
              </div>
            </div>

            {/* Kecerdasan AI */}
            <div className="group p-5 rounded-2xl bg-white border border-slate-200 transition-all hover:border-emerald-100 shadow-sm hover:shadow-md">
              <div className="flex gap-4">
                <div className="mt-1">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-base">
                    Cara Nusantara: Kecerdasan AI
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Ekstraksi sentimen otomatis dari ulasan pelanggan. Ubah
                    data mentah menjadi peta strategi bisnis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Balanced AI Image Box */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-[#0a0a0a] min-h-[400px] h-full flex items-center justify-center shadow-2xl shadow-indigo-100">
          {/* Background image placeholder */}
          <div
            className="absolute inset-0 opacity-50 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: "url('/garuda_ai.png')" }}
          />

          {/* Lapisan gradien tipis di bawah */}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />

          {/* Konten teks */}
          <div className="relative z-10 w-full p-8 space-y-3 mt-auto">
            {stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                desc={stat.desc}
              />
            ))}
          </div>

          {/* Aksesori Dekorasi Digital */}
          <div className="absolute top-6 right-6 flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
