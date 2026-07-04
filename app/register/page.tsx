"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import SVGComponent from "@/components/svg/logo";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const inputContainerClass = "relative mt-2 flex items-center";
  const inputClass =
    "w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1e293b] pl-11 pr-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Registrasi gagal. Silakan coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 text-white antialiased sm:px-6 lg:px-8">
      {/* Tombol Kembali ke Beranda */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-[#1e293b] px-4 py-2 text-xs font-bold text-slate-400 transition hover:border-[#F59E0B]/30 hover:text-[#F59E0B]"
        >
          <ArrowLeft size={14} />
          Kembali
        </Link>
      </div>

      {/* Bagian Konten Form Utama */}
      <div className="w-full max-w-md">
        {/* Header Identitas Brand */}
        <div className="mb-8 text-left">
          <div className="mb-3 flex items-center gap-2">
            <SVGComponent width={40} height={40} viewBox="0 0 200 200" />
            <p className="text-xs font-bold tracking-wider uppercase text-[#F59E0B]">
              NusantaraInsight AI
            </p>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Buat Akun Baru
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Bergabunglah sekarang dan mulailah memanfaatkan kecerdasan data
            untuk mengembangkan bisnis UMKM Anda.
          </p>
        </div>

        {/* Formulir Pendaftaran */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          {/* Field Nama */}
          <div>
            <label
              htmlFor="name"
              className="text-sm font-semibold text-slate-200"
            >
              Nama Lengkap
            </label>
            <div className={inputContainerClass}>
              <User className="absolute left-4 text-slate-500" size={16} />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={inputClass}
                placeholder="Nama bisnis atau pemilik"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Field Email */}
          <div>
            <label
              htmlFor="email"
              className="text-sm font-semibold text-slate-200"
            >
              Email Bisnis
            </label>
            <div className={inputContainerClass}>
              <Mail className="absolute left-4 text-slate-500" size={16} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
                placeholder="nama@bisnis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Field Password */}
          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-slate-200"
            >
              Kata Sandi
            </label>
            <div className={inputContainerClass}>
              <Lock className="absolute left-4 text-slate-500" size={16} />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={inputClass}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Field Konfirmasi Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="text-sm font-semibold text-slate-200"
            >
              Konfirmasi Kata Sandi
            </label>
            <div className={inputContainerClass}>
              <Lock className="absolute left-4 text-slate-500" size={16} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={inputClass}
                placeholder="Masukkan kembali kata sandi Anda"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="group mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-bold text-background transition hover:bg-[#D97706] focus:outline-none focus:ring-4 focus:ring-[#F59E0B]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Membuat akun...
              </>
            ) : (
              <>
                Daftar Sekarang
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </form>

        {/* Tautan Navigasi ke Halaman Login */}
        <div className="mt-8 border-t border-border pt-5 text-center">
          <p className="text-sm text-slate-400">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-bold text-[#F59E0B] transition hover:text-[#D97706]"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      {/* Footer Hak Cipta */}
      <p className="mt-12 text-[11px] font-medium text-slate-500">
        &copy; {new Date().getFullYear()} NusantaraInsight AI. Hak cipta
        dilindungi undang-undang.
      </p>
    </main>
  );
}
