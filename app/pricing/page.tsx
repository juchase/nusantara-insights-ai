"use client";

import Link from "next/link";
import { ArrowLeft, Check, Zap, Server } from "lucide-react";

export default function PricingPage() {
  const tiers = [
    {
      name: "Rintisan (Gratis)",
      price: "Rp 0",
      desc: "Cocok untuk pemilik toko atau pemula yang baru ingin mencoba analitik data.",
      features: [
        "Analisis hingga 150 ulasan / bulan",
        "Model Klasifikasi Sentimen Dasar",
        "Prediksi Permintaan (Maks. 30 hari ke depan)",
        "Ekspor laporan format PDF",
        "Dukungan komunitas lokal",
      ],
      cta: "Mulai Gratis",
      href: "/register",
      featured: false,
    },
    {
      name: "Wirausaha (Premium)",
      price: "Rp 149.000",
      period: "/ bulan",
      desc: "Solusi lengkap untuk UMKM aktif yang membutuhkan prediksi akurat tanpa batas.",
      features: [
        "Analisis ulasan TANPA BATAS",
        "Akses Model Hybrid AI (Rule Engine + LLM)",
        "Prediksi Permintaan Lanjutan (Hingga 180 hari)",
        "Ekspor data lengkap format CSV & Excel",
        "Integrasi API Sistem Kasir (POS)",
        "Dukungan prioritas WhatsApp 24/7",
      ],
      cta: "Langganan Sekarang",
      href: "/register",
      featured: true,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Navigasi Kembali */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#F59E0B] transition mb-10"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>

        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Investasi Transparan untuk UMKM
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Pilih paket yang sesuai dengan skala operasional bisnis Anda. Semua
            data tetap dijamin aman dan berjalan offline pada server lokal Anda.
          </p>
        </div>

        {/* Grid Paket Harga */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col justify-between p-8 bg-[#1e293b] rounded-3xl border backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-[rgba(255,255,255,0.15)] ${
                tier.featured
                  ? "border-[#F59E0B] ring-2 ring-[#F59E0B]/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                  : "border-border"
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#F59E0B] text-background text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-[#F59E0B]/20">
                  Paling Populer
                </span>
              )}

              <div>
                {/* Judul & Harga */}
                <h3 className="text-lg font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-xs text-slate-400 font-semibold">
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  {tier.desc}
                </p>

                {/* List Fitur */}
                <ul className="space-y-3 border-t border-border pt-6 mb-8">
                  {tier.features.map((feat, fIdx) => (
                    <li
                      key={fIdx}
                      className="flex items-start gap-2.5 text-xs text-slate-300 font-medium"
                    >
                      <Check
                        size={14}
                        className="text-[#009B77] mt-0.5 shrink-0"
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tombol Aksi */}
              <Link href={tier.href}>
                <button
                  className={`w-full h-11 rounded-xl text-xs font-bold transition-all ${
                    tier.featured
                      ? "btn-primary"
                      : "glass hover:bg-[rgba(255,255,255,0.05)] text-white"
                  }`}
                >
                  {tier.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
