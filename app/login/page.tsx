"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import SVGComponent from "@/components/svg/logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const inputContainerClass = "relative mt-1 flex items-center";
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50";

  const highlights = [
    {
      icon: <BrainCircuit size={16} />,
      title: "Analisis Sentimen",
      desc: "Petakan pola kepuasan pembeli dari ulasan pasar.",
    },
    {
      icon: <BarChart3 size={16} />,
      title: "Prediksi Permintaan",
      desc: "Antisipasi stok menipis lewat data historis.",
    },
    {
      icon: <ShieldCheck size={16} />,
      title: "Kedaulatan Data Lokal",
      desc: "Sistem berjalan independen dari server internal Anda.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setError(
          data.error || "Akses ditolak. Periksa kembali email dan password.",
        );
      }
    } catch {
      setError("Gangguan koneksi sistem. Silakan coba sesaat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Mengunci tinggi halaman tepat 100vh dan menghilangkan fungsi scroll desktop
    <main className="grid h-screen w-full bg-white text-slate-900 antialiased lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden">
      {/* SISI KIRI: Visual Tech & Brand Authority */}
      <section className="relative hidden h-full flex-col justify-between bg-slate-950 p-12 text-white lg:flex xl:p-16">
        {/* Pola Grid Halus AI */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size[4rem_4rem] mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%) opacity-20" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />

        {/* Navigasi Kembali */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-700 hover:text-white"
          >
            <ArrowLeft size={14} />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Teks Utama & Fitur - Padding dikurangi sedikit agar pas */}
        <div className="relative z-10 my-auto max-w-lg py-4">
          <div className="mb-5 flex items-center gap-3">
            <SVGComponent width={40} height={40} viewBox="0 0 200 200" />
            <span className="text-xs font-black tracking-wider uppercase text-white">
              NusantaraInsight AI
            </span>
          </div>

          <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight xl:text-4xl">
            Akselerasi keputusan bisnis UMKM Anda.
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Masuk ke ekosistem intelijen bisnis terintegrasi untuk membaca
            peluang pasar secara real-time dengan bantuan kecerdasan buatan.
          </p>

          {/* List Keunggulan */}
          <div className="mt-8 space-y-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-slate-900 bg-slate-900/30 p-3.5 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-indigo-400 border border-slate-800">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} NusantaraInsight AI. Hak cipta
          dilindungi undang-undang.
        </p>
      </section>

      {/* SISI KANAN: Form Kerja Minimalis Terfokus */}
      <section className="flex h-full flex-col justify-center overflow-y-auto px-6 py-8 sm:px-12 md:px-20 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Header Responsif Ponsel */}
          <div className="mb-6 flex flex-col items-center lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <SVGComponent width={24} height={24} viewBox="0 0 200 200" />
            </div>
            <h2 className="mt-2.5 text-sm font-black tracking-tight text-slate-950">
              NusantaraInsight AI
            </h2>
          </div>

          {/* Keterangan Form */}
          <div className="mb-6 text-left">
            <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Gerbang Otentikasi
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Gunakan akun terdaftar untuk memulai analisis dasbor.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[11px] font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Field Email */}
            <div>
              <label
                htmlFor="email"
                className="text-[11px] font-bold text-slate-700"
              >
                Alamat Email Kantor / Bisnis
              </label>
              <div className={inputContainerClass}>
                <Mail className="absolute left-4 text-slate-400" size={14} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputClass}
                  placeholder="pemilik@umkm.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Field Password */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[11px] font-bold text-slate-700"
                >
                  Kata Sandi Akses
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  Lupa Akses?
                </Link>
              </div>
              <div className={inputContainerClass}>
                <Lock className="absolute left-4 text-slate-400" size={14} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={inputClass}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Memverifikasi Akun...
                </>
              ) : (
                <>
                  Buka Dasbor Kerja
                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Tautan Registrasi Akun */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500">
              Belum memiliki hak akses platform?{" "}
              <Link
                href="/register"
                className="font-bold text-indigo-600 transition hover:text-indigo-700"
              >
                Daftar Kemitraan UMKM
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
