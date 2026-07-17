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
    "w-full rounded-xl border border-border bg-card pl-11 pr-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary";

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
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 text-foreground antialiased sm:px-6 lg:px-8">
      {/* Tombol Kembali ke Beranda */}
      <div className="absolute top-6 left-112 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-muted transition hover:border-primary/30 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Kembali
        </Link>
      </div>

      {/* Bagian Konten Form Utama */}
      <div className="w-full max-w-md mt-8">
        {/* Header Identitas Brand */}
        <div className="mb-8 text-left">
          <div className="mb-3 flex items-center gap-2">
            <SVGComponent width={40} height={40} viewBox="0 0 200 200" />
            <p className="text-xs font-bold tracking-wider uppercase text-primary">
              NusantaraInsight AI
            </p>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Buat Akun Baru
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Bergabunglah sekarang dan mulailah memanfaatkan kecerdasan data
            untuk mengembangkan bisnis UMKM Anda.
          </p>
        </div>

        {/* Formulir Pendaftaran */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-xs font-semibold text-danger">
              {error}
            </div>
          )}

          {/* Field Nama */}
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-muted">
              Nama Lengkap
            </label>
            <div className={inputContainerClass}>
              <User className="absolute left-4 text-muted" size={16} />
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
            <label htmlFor="email" className="text-sm font-semibold text-muted">
              Email Bisnis
            </label>
            <div className={inputContainerClass}>
              <Mail className="absolute left-4 text-muted" size={16} />
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
              className="text-sm font-semibold text-muted"
            >
              Kata Sandi
            </label>
            <div className={inputContainerClass}>
              <Lock className="absolute left-4 text-muted" size={16} />
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
              className="text-sm font-semibold text-muted"
            >
              Konfirmasi Kata Sandi
            </label>
            <div className={inputContainerClass}>
              <Lock className="absolute left-4 text-muted" size={16} />
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
            className="group mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-background transition hover:bg-primary/80 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
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
          <p className="text-sm text-muted">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-bold text-primary transition hover:text-primary/80"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      {/* Footer Hak Cipta */}
      <p className="mt-12 text-[11px] font-medium text-muted">
        &copy; {new Date().getFullYear()} NusantaraInsight AI. Hak cipta
        dilindungi undang-undang.
      </p>
    </main>
  );
}
