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

  // Menyesuaikan style input yang bersih, bulat tipis, dan flat tanpa shadow tebal khas Meta
  const inputContainerClass = "relative mt-2 flex items-center";
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok dengan password utama.");
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
    // Menggunakan background putih polos (bg-white) tanpa border / card pembungkus luar
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 py-12 text-slate-900 antialiased sm:px-6 lg:px-8">
      {/* Tombol Kembali ke Beranda */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          Kembali
        </Link>
      </div>

      {/* Bagian Konten Form Utama (Lebar maksimal disesuaikan dengan form pendaftaran standar) */}
      <div className="w-full max-w-md">
        {/* Header Identitas Brand ala Meta (Logo + Sub-brand kecil) */}
        <div className="mb-8 text-left">
          <div className="mb-3 flex items-center gap-2">
            <SVGComponent width={40} height={40} viewBox="0 0 200 200" />

            <p className="text-xs font-bold tracking-wider uppercase text-indigo-600">
              NusantaraInsight AI
            </p>
          </div>

          {/* Judul & Deskripsi Pendaftaran (Mirip teks 'Get started on Facebook') */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Buat akun baru
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Daftar sekarang untuk mulai mengoptimalkan keputusan bisnis dan
            analitik produk UMKM Anda.
          </p>
        </div>

        {/* Formulir Pendaftaran Tanpa Box/Card */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* Field Nama */}
          <div>
            <label
              htmlFor="name"
              className="text-sm font-semibold text-slate-800"
            >
              Nama Lengkap
            </label>
            <div className={inputContainerClass}>
              <User className="absolute left-4 text-slate-400" size={16} />
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
              className="text-sm font-semibold text-slate-800"
            >
              Alamat Email
            </label>
            <div className={inputContainerClass}>
              <Mail className="absolute left-4 text-slate-400" size={16} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Field Password */}
          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-slate-800"
            >
              Password
            </label>
            <div className={inputContainerClass}>
              <Lock className="absolute left-4 text-slate-400" size={16} />
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
              className="text-sm font-semibold text-slate-800"
            >
              Konfirmasi Password
            </label>
            <div className={inputContainerClass}>
              <Lock className="absolute left-4 text-slate-400" size={16} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={inputClass}
                placeholder="Masukkan kembali password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Tombol Submit Utama */}
          <button
            type="submit"
            disabled={isLoading}
            className="group mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="mt-8 border-t border-slate-100 pt-5 text-center">
          <p className="text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-bold text-indigo-600 transition hover:text-indigo-700"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      {/* Footer Hak Cipta Ringkas */}
      <p className="mt-12 text-[11px] font-medium text-slate-400">
        &copy; {new Date().getFullYear()} NusantaraInsight AI. Hak cipta
        dilindungi undang-undang.
      </p>
    </main>
  );
}
