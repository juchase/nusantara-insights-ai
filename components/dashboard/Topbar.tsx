"use client";
import { Bell, Menu, Search, Upload } from "lucide-react";
import Link from "next/link";
import DemoCountdown from "@/components/dashboard/DemoCountdown";

export default function Topbar({
  onMobileMenuClick,
}: {
  onMobileMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 h-16 w-full glass border-b  bg-background border-border flex items-center justify-between px-3 sm:px-5 lg:px-6 gap-4">
      {/* KIRI: Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuClick}
          className="flex items-center justify-center sm:hidden w-9 h-9 rounded-xl border border-border bg-[#1e293b]/40 text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors shrink-0"
        >
          <Menu size={16} />
        </button>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-[320px] h-9 bg-[#1e293b]/60 border border-border rounded-xl px-3 transition-colors focus-within:border-[#F59E0B] focus-within:bg-[#1e293b]">
          <Search size={14} className="text-slate-500 shrink-0" />
          <input
            placeholder="Cari dataset, laporan..."
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-white placeholder-slate-500"
          />
        </div>
      </div>

      {/* KANAN: Demo Countdown, Upload, Notifications, Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <DemoCountdown />

        {/* Upload Dataset */}
        <Link
          href="/dashboard/upload"
          className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#F59E0B] text-background text-xs font-bold hover:bg-[#D97706] transition-colors shadow-lg shadow-[#F59E0B]/20"
        >
          <Upload size={14} />
          Upload Dataset
        </Link>
        <Link
          href="/dashboard/upload"
          className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#F59E0B] text-background hover:bg-[#D97706] transition-colors"
        >
          <Upload size={14} />
        </Link>

        {/* Separator */}
        <div className="hidden sm:block w-px h-4 bg-border" />

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl border border-border bg-[#1e293b]/40 text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors flex items-center justify-center">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E24B4A] border-2 border-background" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#F59E0B] to-[#009B77] flex items-center justify-center text-xs font-bold text-background cursor-pointer hover:opacity-90 transition-opacity">
          NI
        </div>
      </div>
    </header>
  );
}
