"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleDemo = async () => {
    try {
      const res = await fetch("/api/demo/spawn", { method: "POST" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Demo error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass backdrop-blur-glass border-b border-glassBorder">
      <div className="mx-auto flex h-topbar max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 shadow-[0_0_30px_rgba(245,158,11,0.18)]">
            <span className="text-primary font-black text-lg">N</span>
          </div>
          <div className="leading-none hidden sm:block">
            <p className="text-sm font-black tracking-tight text-white">
              NusantaraInsights AI
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Business Intelligence
            </p>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-primary transition-colors">
            Solusi
          </Link>
          <Link
            href="/pricing"
            className="hover:text-primary transition-colors"
          >
            Harga
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            Tentang
          </Link>
          <Link
            href="/contact"
            className="hover:text-primary transition-colors"
          >
            Kontak
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Masuk
          </Link>
          <button
            onClick={handleDemo}
            className="btn-primary h-10 px-6 text-sm font-bold"
          >
            Mulai Demo
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-300"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-glassBorder px-6 py-4 space-y-4">
          <Link
            href="#solusi"
            className="block text-sm text-slate-300 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Solusi
          </Link>
          <Link
            href="#harga"
            className="block text-sm text-slate-300 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Harga
          </Link>
          <Link
            href="#tentang"
            className="block text-sm text-slate-300 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Tentang
          </Link>
          <Link
            href="/login"
            className="block text-sm font-medium text-white mt-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            Masuk
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleDemo();
            }}
            className="w-full btn-primary h-10 text-sm font-bold"
          >
            Mulai Demo
          </button>
        </div>
      )}
    </header>
  );
}
