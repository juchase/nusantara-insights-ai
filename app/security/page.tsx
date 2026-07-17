"use client";

import Link from "next/link";
import { ArrowLeft, Scale, AlertTriangle, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition mb-10"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>

        <div className="border-b border-border pb-6 mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Ketentuan Layanan
          </h1>
          <p className="text-sm text-muted mt-2">
            Syarat & Ketentuan Penggunaan Platform NusantaraInsight AI
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Scale size={18} className="text-primary" /> 1. Lisensi Penggunaan
              Aplikasi
            </h2>
            <p>
              Dengan mendaftarkan akun kemitraan UMKM, NusantaraInsight AI
              memberikan hak lisensi non-eksklusif dan terbatas bagi Anda untuk
              memanfaatkan kecerdasan buatan kami dalam mengolah data ulasan
              pasar internal demi kepentingan pengembangan bisnis mandiri.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle size={18} className="text-primary" /> 2. Batasan
              Tanggung Jawab Prediksi
            </h2>
            <p>
              Hasil keluaran algoritma prediksi permintaan merupakan estimasi
              kalkulasi berbasis pola historis data penjualan masa lalu yang
              Anda unggah. Perubahan tren pasar makro, bencana alam, atau
              pergeseran ekonomi luar biasa yang memengaruhi performa bisnis
              nyata di luar kendali akurasi statistik model AI bukan merupakan
              tanggung jawab hukum platform kami.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText size={18} className="text-primary" /> 3. Larangan
              Penyalahgunaan
            </h2>
            <p>
              Pengguna dilarang keras melakukan manipulasi kode, rekayasa balik
              (*reverse engineering*) pada modul kompilasi offline, atau
              menyuntikkan skrip berbahaya ke dalam API pertukaran autentikasi
              login.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
