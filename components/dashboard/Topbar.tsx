"use client";
import { Bell, Menu, Search, Upload } from "lucide-react";
import Link from "next/link";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: 64,
        background: "rgba(247,246,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(229,231,235,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        {/* Hamburger */}
        <button
          onClick={onMenuClick}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#6b7280",
            flexShrink: 0,
          }}
        >
          <Menu size={16} />
        </button>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            maxWidth: 360,
            height: 36,
            background: "rgba(255,255,255,0.8)",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: "0 14px",
          }}
        >
          <Search size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
          <input
            placeholder="Cari dataset, laporan..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "#374151",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <Link
          href="/dashboard/upload"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 36,
            padding: "0 16px",
            background: "#4f46e5",
            color: "#fff",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Upload size={14} />
          Upload Dataset
        </Link>

        <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />

        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #e5e7eb",
            background: "rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#6b7280",
            position: "relative",
          }}
        >
          <Bell size={15} />
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#4f46e5",
              border: "1.5px solid #fff",
            }}
          />
        </button>

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 500,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          NI
        </div>
      </div>
    </header>
  );
}
