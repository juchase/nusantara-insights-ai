"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Package,
  Star,
  TrendingUp,
  Brain,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";

const NAV = [
  {
    section: "Menu Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/upload", label: "Upload Data", icon: Upload },
      { href: "/dashboard/products", label: "Produk", icon: Package },
      { href: "/dashboard/reviews", label: "Ulasan", icon: Star },
    ],
  },
  {
    section: "Analitik",
    items: [
      { href: "/dashboard/forecast", label: "Forecast", icon: TrendingUp },
      { href: "/dashboard/insight", label: "AI Insight", icon: Brain },
    ],
  },
  {
    section: "Lainnya",
    items: [
      { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
    ],
  },
];

function SidebarContent({
  visuallyCollapsed,
  onToggleCollapse,
  onNavigate,
  showToggle = false,
}: {
  visuallyCollapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  showToggle?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/");
  };

  return (
    <>
      {/* Header */}
      <div
        style={{
          height: 64,
          padding: visuallyCollapsed ? "0 17px" : "0 14px 0 20px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: visuallyCollapsed ? "center" : "space-between",
          gap: 8,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
            flex: 1,
            justifyContent: visuallyCollapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              flexShrink: 0,
              background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
            }}
          >
            NI
          </div>
          {!visuallyCollapsed && (
            <div style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                NusantaraInsight
              </p>
              <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                AI Business Intelligence
              </p>
            </div>
          )}
        </div>

        {showToggle && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7280",
              flexShrink: 0,
              marginRight: !visuallyCollapsed ? "0px" : "11px",
            }}
            title={visuallyCollapsed ? "Perluas sidebar" : "Perkecil sidebar"}
          >
            {visuallyCollapsed ? (
              <PanelLeftOpen size={14} />
            ) : (
              <PanelLeftClose size={14} />
            )}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p
              style={{
                fontSize: 10,
                color: "#9ca3af",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "10px 8px 4px",
                opacity: visuallyCollapsed ? 0 : 1,
                transition: "opacity 0.15s",
                whiteSpace: "nowrap",
                height: visuallyCollapsed ? 0 : "auto",
                overflow: "hidden",
              }}
            >
              {section}
            </p>
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  title={visuallyCollapsed ? label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: visuallyCollapsed ? "10px 0" : "8px 10px",
                    justifyContent: visuallyCollapsed ? "center" : "flex-start",
                    borderRadius: 7,
                    fontSize: 12.5,
                    color: active ? "#4f46e5" : "#4b5563",
                    background: active ? "#eef2ff" : "transparent",
                    fontWeight: active ? 500 : 400,
                    textDecoration: "none",
                    marginBottom: 2,
                    transition: "background 0.12s, color 0.12s, padding 0.22s",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    paddingLeft: 10,
                  }}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      opacity: visuallyCollapsed ? 0 : 1,
                      maxWidth: visuallyCollapsed ? 0 : 160,
                      transition: "opacity 0.15s, max-width 0.22s",
                      overflow: "hidden",
                    }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer — Production info + Logout */}
      <div
        style={{
          padding: "8px 10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* ✅ Production card — ganti dari Sprint 6 */}
        {!visuallyCollapsed && (
          <div
            style={{
              padding: "11px 12px",
              background: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#1D9E75",
                }}
              />
              <p style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>
                Sistem Aktif
              </p>
            </div>
            <p style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.5 }}>
              Rule Engine + LLM berjalan normal
            </p>
          </div>
        )}

        {/* ✅ Logout button */}
        <button
          onClick={handleLogout}
          title={visuallyCollapsed ? "Keluar" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: visuallyCollapsed ? "10px 0" : "9px 10px",
            justifyContent: visuallyCollapsed ? "center" : "flex-start",
            borderRadius: 7,
            fontSize: 12.5,
            color: "#dc2626",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "100%",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          <span
            style={{
              opacity: visuallyCollapsed ? 0 : 1,
              maxWidth: visuallyCollapsed ? 0 : 120,
              transition: "opacity 0.15s, max-width 0.22s",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            Keluar
          </span>
        </button>
      </div>
    </>
  );
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const visuallyCollapsed = collapsed;
  const sidebarWidth = collapsed ? 64 : 232;

  return (
    <>
      {/* ── MOBILE SIDEBAR ───────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onNavigate}
          />
          {/* ✅ Fix: h-screen + flex flex-col */}
          <aside
            className="fixed left-0 top-0 z-50 lg:hidden"
            style={{
              width: 260,
              height: "100vh", // ← fix tinggi penuh
              display: "flex",
              flexDirection: "column", // ← fix agar footer di bawah
              background: "#fff",
              borderRight: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <SidebarContent
              visuallyCollapsed={false}
              onNavigate={onNavigate}
              showToggle={false}
            />
          </aside>
        </>
      )}

      {/* ── DESKTOP SIDEBAR ──────────────────────────── */}
      <aside
        className="hidden lg:flex"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth, // ← kunci agar konten tidak tumpang tindih
          height: "100vh",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          zIndex: 30,
          flexDirection: "column",
          transition:
            "width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
        }}
      >
        <SidebarContent
          visuallyCollapsed={visuallyCollapsed}
          onToggleCollapse={onToggleCollapse}
          onNavigate={onNavigate}
          showToggle={true}
        />
      </aside>
    </>
  );
}
