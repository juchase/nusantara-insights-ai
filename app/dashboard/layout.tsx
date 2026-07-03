"use client";
import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        background: "#f7f6ff",
        display: "flex",
        overflowX: "hidden",
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((p) => !p)} // ← toggle dari sidebar
        mobileOpen={mobileSidebarOpen}
        onNavigate={() => setMobileSidebarOpen(false)}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Topbar
          onMobileMenuClick={() => setMobileSidebarOpen((p) => !p)} // ← hanya mobile
        />
        <main className="mx-auto w-full max-w-[1440px] px-3 pb-8 sm:px-5 md:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
