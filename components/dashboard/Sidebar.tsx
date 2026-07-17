"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Star,
  TrendingUp,
  Brain,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
} from "lucide-react";
import SVGComponent from "../svg/logo";

const NAV = [
  {
    section: "Menu Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/report", label: "Laporan", icon: FileText },
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
    <div className="flex flex-col h-full bg-card text-foreground">
      {/* ── HEADER ────────────────────────────────────── */}
      <div
        className={`h-16 flex items-center border-b border-border shrink-0 overflow-hidden transition-all duration-200 ${
          visuallyCollapsed ? "justify-center px-4" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center gap-0.5 overflow-hidden ${
            visuallyCollapsed ? "justify-center" : "justify-start"
          }`}
        >
          <SVGComponent />
          {!visuallyCollapsed && (
            <div className="whitespace-nowrap overflow-hidden">
              <p className="text-sm font-bold text-foreground">
                NusantaraInsight
              </p>
              <p className="text-[10px] text-muted mt-0.5">
                AI Business Intelligence
              </p>
            </div>
          )}
        </div>

        {showToggle && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`flex items-center justify-center w-7 h-7 rounded-lg border border-border bg-card/50 text-muted hover:text-foreground hover:bg-card transition-colors cursor-pointer shrink-0 ${
              visuallyCollapsed ? "ml-0" : "mr-3"
            }`}
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

      {/* ── NAVIGASI ──────────────────────────────────────── */}
      <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden flex flex-col">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.06em] text-muted pt-3 pb-1 px-2 transition-opacity duration-200 ${
                visuallyCollapsed
                  ? "opacity-0 h-0 overflow-hidden p-0"
                  : "opacity-100 mb-2"
              }`}
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
                  className={`flex items-center gap-3 py-2.5 mb-1 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap overflow-hidden ${
                    visuallyCollapsed
                      ? "justify-center px-4"
                      : "justify-start px-2"
                  } ${
                    active
                      ? "text-primary bg-primary/10 border-l-4 border-primary"
                      : "text-muted hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <Icon size={16} className="shrink-0 ml-2" />
                  <span
                    className={`transition-all duration-200 ${
                      visuallyCollapsed
                        ? "opacity-0 max-w-0"
                        : "opacity-100 max-w-[160px]"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <div className="p-3 flex flex-col gap-2">
        {/* System Status Card */}
        {!visuallyCollapsed && (
          <div className="glass p-3.5 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <p className="text-[11px] font-bold text-foreground">
                Sistem Aktif
              </p>
            </div>
            <p className="text-[10px] text-muted leading-tight">
              Rule Engine + LLM berjalan normal
            </p>
          </div>
        )}
      </div>
    </div>
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
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onNavigate}
          />
          <aside className="fixed left-0 top-0 z-50 lg:hidden w-[260px] h-full bg-card border-r border-border overflow-hidden flex flex-col">
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
        className="hidden lg:flex flex-col h-full bg-card border-r border-border sticky top-0 z-30 overflow-hidden"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          transition:
            "width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1)",
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
