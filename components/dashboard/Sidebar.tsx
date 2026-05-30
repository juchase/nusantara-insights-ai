"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void; // ← toggle dari dalam sidebar
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const visuallyCollapsed = collapsed;
  const sidebarWidth = collapsed ? 64 : 232;

  return (
    <>
      {/* Overlay gelap — mobile only */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onNavigate}
          />

          <aside
            className="fixed left-0 top-0 z-50 h-screen w-72 lg:hidden"
            style={{
              background: "#fff",
              borderRight: "1px solid #e5e7eb",
            }}
          >
            {/* isi sidebar */}
            <div
              style={{
                height: 64,
                padding: visuallyCollapsed ? "0 17px" : "0 14px 0 20px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                alignItems: "center",
                minHeight: "64px",
                justifyContent: visuallyCollapsed ? "center" : "space-between",
                gap: 8,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {/* Logo */}
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
                  <div
                    style={{
                      opacity: visuallyCollapsed ? 0 : 1,
                      transform: visuallyCollapsed
                        ? "translateX(-8px)"
                        : "translateX(0)",
                      transition: "opacity 0.18s, transform 0.18s",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#111827",
                      }}
                    >
                      NusantaraInsight
                    </p>
                    <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                      AI Business Intelligence
                    </p>
                  </div>
                )}
              </div>
            </div>

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
                          justifyContent: visuallyCollapsed
                            ? "center"
                            : "flex-start",
                          borderRadius: 7,
                          fontSize: 12.5,
                          color: active ? "#4f46e5" : "#4b5563",
                          background: active ? "#eef2ff" : "transparent",
                          fontWeight: active ? 500 : 400,
                          textDecoration: "none",
                          marginBottom: 2,
                          transition:
                            "background 0.12s, color 0.12s, padding 0.22s",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
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

            {/* Footer */}
            {!visuallyCollapsed && (
              <div
                style={{
                  margin: "8px 10px 12px",
                  padding: "11px 12px",
                  background: "#f9fafb",
                  borderRadius: 8,
                  border: "1px solid #f3f4f6",
                }}
              >
                <p style={{ fontSize: 11, color: "#6b7280" }}>Sprint 6</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>
                  Hybrid AI Architecture
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 5,
                    fontSize: 10,
                    color: "#3B6D11",
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
                  Rule Engine + LLM Active
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      <aside
        className="hidden lg:flex"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: "100dvh",
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
        {/* Header — Logo + Toggle button */}
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
          {/* Logo */}
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
              <div
                style={{
                  opacity: visuallyCollapsed ? 0 : 1,
                  transform: visuallyCollapsed
                    ? "translateX(-8px)"
                    : "translateX(0)",
                  transition: "opacity 0.18s, transform 0.18s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                  NusantaraInsight
                </p>
                <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                  AI Business Intelligence
                </p>
              </div>
            )}
          </div>

          {/* ← Toggle button di dalam sidebar — desktop only */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex"
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
              transition: "background 0.12s, margin 0.22s", // Ditambahkan transisi margin agar pergerakan mulus
              // PERUBAHAN: Menambahkan marginRight saat collapsed untuk mendorong tombol ke kiri
              marginRight: visuallyCollapsed ? "10px" : "0px",
            }}
            title={visuallyCollapsed ? "Perluas sidebar" : "Perkecil sidebar"}
          >
            {visuallyCollapsed ? (
              <PanelLeftOpen size={14} />
            ) : (
              <PanelLeftClose size={14} />
            )}
          </button>
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
                      width: "100%",
                      gap: 10,
                      padding: visuallyCollapsed ? "10px" : "10px 14px",
                      justifyContent: visuallyCollapsed
                        ? "center"
                        : "flex-start",
                      borderRadius: 7,
                      fontSize: 12.5,
                      color: active ? "#4f46e5" : "#4b5563",
                      background: active ? "#eef2ff" : "transparent",
                      fontWeight: active ? 500 : 400,
                      textDecoration: "none",
                      marginBottom: 2,
                      transition:
                        "background 0.12s, color 0.12s, padding 0.22s",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icon
                      size={16}
                      style={{
                        flexShrink: 0,
                        marginLeft: visuallyCollapsed ? "4px" : "0px",
                        transition: "margin 0.22s",
                      }}
                    />

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

        {/* Footer */}
        {!visuallyCollapsed && (
          <div
            style={{
              margin: "8px 10px 12px",
              padding: "11px 12px",
              background: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #f3f4f6",
            }}
          >
            <p style={{ fontSize: 11, color: "#6b7280" }}>Sprint 6</p>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>
              Hybrid AI Architecture
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 5,
                fontSize: 10,
                color: "#3B6D11",
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
              Rule Engine + LLM Active
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
