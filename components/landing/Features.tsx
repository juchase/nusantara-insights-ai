"use client";

import { Smile, BarChart3, Lightbulb } from "lucide-react";

export default function Features() {
  const feats = [
    {
      title: "Analisis Sentimen",
      desc: "Pahami apa yang pelanggan rasakan dari setiap ulasan. Sistem mengkategorikan sentimen dan mengidentifikasi aspek produk yang paling sering dikeluhkan.",
      icon: <Smile size={22} className="text-secondary" />,
      bgIcon: "bg-secondary/10 border-secondary/20",
    },
    {
      title: "Prediksi Permintaan",
      desc: "Antisipasi lonjakan permintaan sebelum terjadi. Model prediksi adaptif memilih algoritma terbaik berdasarkan pola data historis penjualan kamu.",
      icon: <BarChart3 size={22} className="text-tertiary" />,
      bgIcon: "bg-tertiary/10 border-tertiary/20",
    },
    {
      title: "Generator Insight AI",
      desc: "Dapatkan rekomendasi aksi bisnis yang konkret. Rule engine menganalisis data dan LLM menyajikannya dalam bahasa yang mudah dipahami.",
      icon: <Lightbulb size={22} className="text-primary" />,
      bgIcon: "bg-primary/10 border-primary/20",
    },
  ];

  return (
    <section className="py-24 bg-background text-center border-y border-border">
      {/* Header Utama Section */}
      <div className="max-w-3xl mx-auto mb-16 px-6">
        <h2 className="text-3xl lg:text-4xl font-black text-foreground mb-4 tracking-tight leading-tight">
          Dibangun untuk Kecerdasan Bisnis Nyata
        </h2>
        <p className="text-sm lg:text-base text-muted max-w-xl mx-auto leading-relaxed">
          Fitur kecerdasan buatan terintegrasi yang dirancang khusus untuk
          menyederhanakan data operasional UMKM Indonesia.
        </p>
      </div>

      {/* Grid Kartu Fitur Utama */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-6">
        {feats.map((f, i) => (
          <div
            key={i}
            className="group relative glass-card p-8 border border-border shadow-lg shadow-black/10 transition-all duration-300 hover:shadow-xl hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-1 text-left"
          >
            {/* Latar Belakang Ikon Unik untuk Tiap Fitur */}
            <div
              className={`w-12 h-12 ${f.bgIcon} border rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105`}
            >
              {f.icon}
            </div>

            {/* Teks Judul */}
            <h3 className="font-bold text-lg mb-3 text-foreground tracking-tight transition-colors duration-200 group-hover:text-primary">
              {f.title}
            </h3>

            {/* Teks Deskripsi */}
            <p className="text-muted text-xs lg:text-sm leading-relaxed font-medium">
              {f.desc}
            </p>

            {/* Garis Aksen Dekoratif */}
            <div className="absolute bottom-0 inset-x-8 h-[2px] bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
