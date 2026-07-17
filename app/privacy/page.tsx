"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff } from "lucide-react";

export default function PrivacyPage() {
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

        {/* Header Dokumen */}
        <div className="border-b border-border pb-6 mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Kebijakan Privasi
          </h1>
          <p className="text-sm text-muted mt-2">
            Terakhir diperbarui: {new Date().getFullYear()} — NusantaraInsight
            AI
          </p>
        </div>

        {/* Konten Regulasi */}
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" /> 1. Komitmen
              Kedaulatan Data Offline
            </h2>
            <p>
              NusantaraInsight AI berkomitmen penuh melindungi rahasia dagang
              dan data operasional UMKM Indonesia. Seluruh proses pengolahan
              data, termasuk{" "}
              <strong className="text-foreground">Analisis Sentimen</strong> dan{" "}
              <strong className="text-foreground">Prediksi Permintaan</strong>,
              berjalan 100% pada infrastruktur server lokal atau perangkat
              komputer Anda sendiri.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <EyeOff size={18} className="text-primary" /> 2. Jenis Data yang
              Diunggah
            </h2>
            <p>
              Saat Anda mengunggah berkas dataset berformat CSV ke dalam dasbor
              kerja, data tersebut dimuat langsung ke dalam memori peramban atau
              dialirkan ke kontainer lokal. Tidak ada pelacakan, kloning, atau
              transmisi salinan data ulasan maupun data penjualan ke server
              eksternal global kami.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock size={18} className="text-primary" /> 3. Keamanan Akun
            </h2>
            <p>
              Kredensial login Anda (Email dan sandi yang telah di-hash) adalah
              satu-satunya data yang disimpan dalam basis data terenkripsi cloud
              kami untuk kebutuhan otentikasi hak akses masuk aplikasi dasbor
              Anda.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
