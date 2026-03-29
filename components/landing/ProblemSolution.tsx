"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProblemSolution() {
  return (
    // Menggunakan bg-slate-50 dan border-y agar terpisah jelas dari section putih
    <section className="py-18 bg-slate-50 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
        {/* LEFT SIDE - Content */}
        <div className="flex flex-col justify-center space-y-8 py-4">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Stop Guessing. <br />
              <span className="text-indigo-600">Start Growing.</span>
            </h2>
            <p className="text-gray-500 max-w-md">
              Tinggalkan metode lama yang memakan waktu. Gunakan teknologi AI
              untuk memahami pelanggan Anda secara mendalam.
            </p>
          </div>

          <div className="space-y-5">
            {/* Manual Struggle */}
            <div className="group p-5 rounded-2xl bg-white border border-slate-200 transition-all hover:border-red-100 shadow-sm hover:shadow-md">
              <div className="flex gap-4">
                <div className="mt-1">
                  <AlertCircle className="text-red-500" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-base">
                    The Old Way: Manual Struggle
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Sifting through hundreds of reviews manually is slow,
                    biased, and misses the big picture.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Intelligence */}
            <div className="group p-5 rounded-2xl bg-white border border-slate-200 transition-all hover:border-emerald-100 shadow-sm hover:shadow-md">
              <div className="flex gap-4">
                <div className="mt-1">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-base">
                    The Nusantara Way: AI Intelligence
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Automated sentiment extraction. We turn noise into a
                    strategic roadmap for your local business.
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
            style={{ backgroundImage: "url('/ai-face.jpg')" }}
          />

          {/* Overlay Gradient agar teks lebih terbaca */}
          <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />

          <div className="relative text-center z-10 p-8">
            <h3 className="text-6xl font-black text-emerald-400 mb-2 drop-shadow-2xl">
              98%
            </h3>
            <p className="text-white/80 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              Accuracy Rate
            </p>
            <p className="text-white/60 text-sm leading-relaxed max-w-[280px] mx-auto">
              Precision in sentiment classification across Bahasa Indonesia and
              local dialects.
            </p>
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
