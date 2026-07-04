"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Server, CheckCircle } from "lucide-react";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#F59E0B] transition mb-10"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>

        <div className="border-b border-border pb-6 mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Infrastruktur & Keamanan
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Bagaimana NusantaraInsight AI menjaga kedaulatan data rahasia bisnis
            Anda.
          </p>
        </div>

        {/* Grid List Keamanan */}
        <div className="space-y-6">
          {[
            {
              icon: <Server className="w-5 h-5" />,
              title: "Sandboxing Memori Lokal",
              desc: "Unggahan file CSV data operasional diproses di dalam memori sandbox lokal terisolasi. Data langsung dihancurkan dari ram peramban begitu sesi analisis dasbor kerja Anda ditutup.",
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: "Enkripsi Transportasi Data (TLS 1.3)",
              desc: "Proses sinkronisasi otentikasi akun dan token lisensi dilakukan menggunakan protokol kriptografi TLS 1.3 dengan enkripsi AES-256 bit guna mencegah intersepsi jaringan.",
            },
            {
              icon: <CheckCircle className="w-5 h-5" />,
              title: "Kepatuhan Regulasi Lokal (UU PDP)",
              desc: "Seluruh manajemen penyimpanan akun NusantaraInsight AI patuh sepenuhnya pada prinsip perlindungan kedaulatan data pribadi sesuai regulasi Undang-Undang PDP Indonesia.",
            },
          ].map((sec, idx) => (
            <div
              key={idx}
              className="flex gap-4 p-5 rounded-2xl glass border border-border"
            >
              <div className="mt-1 shrink-0 bg-[#F59E0B]/10 w-10 h-10 rounded-xl flex items-center justify-center border border-[#F59E0B]/20 text-[#F59E0B]">
                {sec.icon}
              </div>
              <div>
                <h3 className="font-bold text-white text-base mb-1">
                  {sec.title}
                </h3>
                <p className="text-slate-400 text-xs lg:text-sm leading-relaxed font-medium">
                  {sec.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
