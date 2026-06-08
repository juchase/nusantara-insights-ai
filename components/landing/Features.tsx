"use client";

import { Smile, BarChart3, Lightbulb } from "lucide-react";

export default function Features() {
  const feats = [
    {
      title: "Analisis Sentimen",
      desc: "Pahami apa yang pelanggan rasakan dari setiap ulasan. Sistem mengkategorikan sentimen dan mengidentifikasi aspek produk yang paling sering dikeluhkan.",
      icon: <Smile className="text-indigo-600" />,
    },
    {
      title: "Prediksi Permintaan",
      desc: "Antisipasi lonjakan permintaan sebelum terjadi. Model prediksi adaptif memilih algoritma terbaik berdasarkan pola data historis penjualan kamu.",
      icon: <BarChart3 className="text-indigo-600" />,
    },
    {
      title: "Generator Insight AI",
      desc: "Dapatkan rekomendasi aksi bisnis yang konkret. Rule engine menganalisis data, LLM lokal menyajikannya dalam bahasa yang mudah dipahami.",
      icon: <Lightbulb className="text-indigo-600" />,
    },
  ];

  return (
    <section className="py-20 bg-white text-center">
      <div className="max-w-4xl mx-auto mb-20 px-6">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
          Dibangun untuk Kecerdasan Bisnis Nyata
        </h2>
        <p className="text-gray-500">
          Fitur AI yang dirancang khusus untuk kebutuhan UMKM Indonesia.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-6">
        {feats.map((f, i) => (
          <div
            key={i}
            className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 text-left"
          >
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
              {f.icon}
            </div>
            <h3 className="font-bold text-xl mb-4 text-slate-900">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
