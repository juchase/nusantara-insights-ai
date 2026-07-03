"use client";
import { Bell, Menu, Search, Upload } from "lucide-react";
import Link from "next/link";
import DemoCountdown from "@/components/dashboard/DemoCountdown";

export default function Topbar({
  onMobileMenuClick,
}: {
  onMobileMenuClick: () => void; // ← hanya mobile
}) {
  return (
    <header
      className="px-3 sm:px-5 lg:px-6"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: 64,
        background: "rgba(255,255,255,0.75)", // Diubah ke putih transparan agar backdrop-blur lebih bersih
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(229,231,235,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Hamburger — mobile only */}
        <button
          className="flex items-center justify-center sm:hidden"
          onClick={onMobileMenuClick}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10, // Diperhalus sudut kelengkungannya
            border: "1px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            color: "#4b5563",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.borderColor = "#d1d5db";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#e5e7eb";
          }}
        >
          <Menu size={16} />
        </button>

        {/* Search Bar — Ditambahkan efek transisi ringkas saat fokus */}
        <div
          className="hidden lg:flex"
          style={{
            alignItems: "center",
            gap: 8,
            flex: 1,
            maxWidth: 320, // Dipersempit sedikit agar lebih seimbang di layar lebar
            height: 36,
            background: "#f9fafb", // Diubah ke warna abu-abu tipis untuk membedakan kontras dari topbar
            border: "1px solid #e5e7eb",
            borderRadius: 10, // Menggunakan pola sudut yang seragam dengan tombol
            padding: "0 12px",
            transition: "all 0.15s ease",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = "#4f46e5";
            e.currentTarget.style.background = "#fff";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.background = "#f9fafb";
          }}
        >
          <Search size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
          <input
            placeholder="Cari dataset, laporan..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 12.5,
              fontWeight: 500,
              color: "#1f2937",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Akses Konten Kanan */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <DemoCountdown />
        {/* Tombol Upload Dataset */}
        <Link
          className="px-3.5 sm:px-4"
          href="/dashboard/upload"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 36,
            background: "#4f46e5",
            color: "#fff",
            borderRadius: 10,
            fontSize: 12.5,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 4px rgba(79, 70, 229, 0.08)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#4338ca";
            e.currentTarget.style.transform = "translateY(-0.5px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#4f46e5";
            e.currentTarget.style.transform = "translateY(0px)";
          }}
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Upload Dataset</span>
        </Link>

        {/* Garis Pembatas */}
        <div
          className="hidden sm:block"
          style={{
            width: 1,
            height: 16,
            background: "#e5e7eb",
            margin: "0 4px",
          }}
        />

        {/* Tombol Notifikasi */}
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#4b5563",
            position: "relative",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.color = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#4b5563";
          }}
        >
          <Bell size={15} />
          {/* Titik indikator live notifikasi bercahaya */}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#ef4444", // Diubah ke warna merah cerah universal notifikasi
              border: "1.5px solid #fff",
              boxShadow: "0 0 4px rgba(239, 68, 68, 0.5)",
            }}
          />
        </button>

        {/* Avatar Profil Inisial Pengguna */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
            letterSpacing: "0.02em",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.95";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          NI
        </div>
      </div>
    </header>
  );
}
