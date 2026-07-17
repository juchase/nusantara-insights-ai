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
    "w-full rounded-xl border border-border bg-card pl-11 pr-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary";

  const highlights = [
    {
      icon: <BrainCircuit size={16} />,
      title: "Analisis Sentimen",
      desc: "Pahami apa yang pelanggan rasakan dari setiap ulasan yang mereka tulis.",
    },
    {
      icon: <BarChart3 size={16} />,
      title: "Prediksi Permintaan",
      desc: "Antisipasi kebutuhan stok sebelum kehabisan, berdasarkan tren penjualan historis.",
    },
    {
      icon: <ShieldCheck size={16} />,
      title: "Data Tetap di Tangan Anda",
      desc: "Semua proses AI berjalan lokal di perangkat Anda. Tidak ada data yang keluar ke cloud.",
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
          data.error || "Email atau kata sandi tidak cocok. Coba lagi ya.",
        );
      }
    } catch {
      setError("Terjadi gangguan koneksi. Silakan coba beberapa saat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid h-screen w-full bg-background text-foreground antialiased lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden">
      {/* SISI KIRI: Visual Tech & Brand Authority */}
      <section className="relative hidden h-full flex-col justify-between bg-background p-12 lg:flex xl:p-16">
        {/* Pola Grid Halus AI */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%) opacity-20" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />

        {/* Navigasi Kembali */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted transition hover:border-primary hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Kembali
          </Link>
        </div>

        {/* Teks Utama & Fitur */}
        <div className="relative z-10 my-auto max-w-lg py-4">
          <div className="mb-5 flex items-center gap-3">
            <SVGComponent width={40} height={40} viewBox="0 0 200 200" />
            <span className="text-xs font-black tracking-wider uppercase text-foreground">
              NusantaraInsight AI
            </span>
          </div>

          <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight xl:text-4xl">
            Bantu UMKM Anda <br />
            <span className="text-primary">membaca pasar</span> lebih tajam.
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Masuk ke dashboard analitik yang dirancang khusus untuk pelaku usaha
            lokal. Data tetap aman, prediksi tetap akurat, dan semua berjalan
            tanpa bergantung pada internet.
          </p>

          {/* List Keunggulan */}
          <div className="mt-8 space-y-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-border bg-card/50 p-3.5 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-muted">
          &copy; {new Date().getFullYear()} NusantaraInsight AI
        </p>
      </section>

      {/* SISI KANAN: Form Kerja Minimalis */}
      <section className="flex h-full flex-col justify-center overflow-y-auto px-6 py-8 sm:px-12 md:px-20 lg:px-16 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-md">
          {/* Header Mobile */}
          <div className="mb-6 flex flex-col items-center lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-background">
              <SVGComponent width={24} height={24} viewBox="0 0 200 200" />
            </div>
            <h2 className="mt-2.5 text-sm font-black tracking-tight text-foreground">
              NusantaraInsight AI
            </h2>
          </div>

          {/* Judul Form */}
          <div className="mb-6 text-left">
            <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Masuk ke Dasbor
            </h2>
            <p className="mt-1 text-xs text-muted">
              Masukkan email dan kata sandi untuk memulai analisis bisnis Anda.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-[11px] font-semibold text-danger">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-[11px] font-bold text-muted"
              >
                Email
              </label>
              <div className={inputContainerClass}>
                <Mail className="absolute left-4 text-muted" size={14} />
                <input
                  id="email"
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[11px] font-bold text-muted"
                >
                  Kata Sandi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-primary transition hover:text-primary/80"
                >
                  Lupa?
                </Link>
              </div>
              <div className={inputContainerClass}>
                <Lock className="absolute left-4 text-muted" size={14} />
                <input
                  id="password"
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
              className="group mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-background transition hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Buka Dasbor
                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Footer Registrasi */}
          <div className="mt-6 border-t border-border pt-5 text-center">
            <p className="text-xs text-muted">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-bold text-primary transition hover:text-primary/80"
              >
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
