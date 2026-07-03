"use client";

import Link from "next/link";
import { ArrowLeft, Terminal, Code2, Play } from "lucide-react";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition mb-10"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>

        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Dokumentasi API
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Panduan integrasi modul pemrosesan data otomatis untuk pengembang
            lokal.
          </p>
        </div>

        <div className="space-y-8">
          {/* Deskripsi Atas */}
          <p className="text-sm text-slate-600 leading-relaxed">
            API NusantaraInsight AI memungkinkan sistem kasir atau platform toko
            online mandiri Anda untuk mengirimkan ulasan mentah dan menerima
            klaster analisis sentimen Bahasa Indonesia secara instan.
          </p>

          {/* Endpoint Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Terminal size={18} className="text-indigo-600" /> Analisis
              Sentimen Instan
            </h2>

            <div className="flex items-center gap-3 bg-slate-900 text-xs font-mono p-3 rounded-xl text-white">
              <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                POST
              </span>
              <span>/api/v1/analyze-sentiment</span>
            </div>

            {/* Code Block Request */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Code2 size={14} /> Contoh Payload Masukan (JSON)
              </p>
              <pre className="bg-slate-950 text-indigo-300 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                {`{
  "review_text": "Pelayanan kasir sangat lambat, tapi produknya sangat gurih dan renyah.",
  "lang": "id"
}`}
              </pre>
            </div>

            {/* Code Block Response */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Play size={14} /> Respon Balikan AI (JSON)
              </p>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
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
