"use client";

import Link from "next/link";
import { ArrowLeft, Target, Users, Landmark } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        {/* Navigasi Kembali */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition mb-10"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>

        {/* Header Section */}
        <div className="border-b border-border pb-6 mb-10">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Tentang NusantaraInsight AI
          </h1>
          <p className="text-base text-muted mt-2 leading-relaxed">
            Menghadirkan kecerdasan data tingkat korporasi ke genggaman pemilik
            bisnis lokal di seluruh Indonesia.
          </p>
        </div>

        {/* Konten Cerita / Visi */}
        <div className="space-y-10 text-sm leading-relaxed text-muted">
          <section className="space-y-3">
            <p>
              Lahir dari kesadaran bahwa data ulasan pelanggan dan riwayat
              penjualan sering kali dibiarkan menumpuk begitu saja di arsip
              UMKM,{" "}
              <strong className="text-foreground">NusantaraInsight AI</strong>{" "}
              hadir sebagai jembatan teknologi. Kami percaya bahwa untuk
              bersaing di era digital, pelaku bisnis lokal tidak harus
              mengirimkan rahasia dagang mereka ke server cloud asing.
            </p>
          </section>

          {/* Nilai Utama / Visi Misi Grid */}
          <div className="grid sm:grid-cols-2 gap-6 pt-4">
            <div className="p-5 rounded-2xl glass border border-border">
              <div className="w-9 h-9 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center mb-4">
                <Target size={18} />
              </div>
              <h3 className="font-bold text-foreground text-base mb-1.5">
                Misi Kami
              </h3>
              <p className="text-muted text-xs leading-relaxed font-medium">
                Demokratisasi kecerdasan buatan (AI) agar mudah dipahami, murah
                diakses, dan aman dijalankan tanpa infrastruktur internet yang
                rumit.
              </p>
            </div>

            <div className="p-5 rounded-2xl glass border border-border">
              <div className="w-9 h-9 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl flex items-center justify-center mb-4">
                <Landmark size={18} />
              </div>
              <h3 className="font-bold text-foreground text-base mb-1.5">
                Kedaulatan Data
              </h3>
              <p className="text-muted text-xs leading-relaxed font-medium">
                Mendukung kepatuhan perlindungan data nasional dengan
                mengoptimalkan model pemrosesan lokal (sandbox offline) di
                server UMKM sendiri.
              </p>
            </div>
          </div>

          <section className="space-y-3 border-t border-border pt-8">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users size={18} className="text-primary" /> Komunitas & Masa
              Depan
            </h2>
            <p>
              Saat ini, kami terus memperbarui kamus dan kecerdasan model bahasa
              alami (NLP) agar semakin peka terhadap struktur dialek, singkatan
              kata, serta bahasa gaul yang sering digunakan konsumen Indonesia
              dalam memberikan ulasan pasar di marketplace maupun media sosial.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
