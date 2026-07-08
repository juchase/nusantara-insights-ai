"use client";

import Link from "next/link";
import { ArrowLeft, Terminal, Code2, Play } from "lucide-react";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#F59E0B] transition mb-10"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>

        <div className="border-b border-border pb-6 mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Dokumentasi API
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Panduan integrasi modul pemrosesan data otomatis untuk pengembang
            lokal.
          </p>
        </div>

        <div className="space-y-8">
          {/* Deskripsi Atas */}
          <p className="text-sm text-slate-300 leading-relaxed">
            API NusantaraInsight AI memungkinkan sistem kasir atau platform toko
            online mandiri Anda untuk mengirimkan ulasan mentah dan menerima
            klaster analisis sentimen Bahasa Indonesia secara instan.
          </p>

          {/* Endpoint Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-[#F59E0B]" /> Analisis
              Sentimen Instan
            </h2>

            <div className="flex items-center gap-3 bg-[#1e293b] text-xs font-mono p-3 rounded-xl text-white border border-border">
              <span className="bg-[#009B77] text-background font-bold px-2 py-0.5 rounded">
                POST
              </span>
              <span>/api/v1/analyze-sentiment</span>
            </div>

            {/* Code Block Request */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Code2 size={14} /> Contoh Payload Masukan (JSON)
              </p>
              <pre className="bg-[#1e293b] text-[#F59E0B] p-4 rounded-xl text-xs font-mono overflow-x-auto border border-border">
                {`{
  "review_text": "Pelayanan kasir sangat lambat, tapi produknya sangat gurih dan renyah.",
  "lang": "id"
}`}
              </pre>
            </div>

            {/* Code Block Response */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Play size={14} /> Respon Balikan AI (JSON)
              </p>
              <pre className="bg-[#1e293b] text-[#009B77] p-4 rounded-xl text-xs font-mono overflow-x-auto border border-border">
                {`{
  "status": "success",
  "sentiment": "mixed",
  "confidence": 0.94,
  "aspects": {
    "pelayanan": "negative",
    "produk": "positive"
  }
}`}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
