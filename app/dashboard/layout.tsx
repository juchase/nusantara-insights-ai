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
    <div className="min-h-screen h-screen bg-background flex overflow-x-hidden text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((p) => !p)}
        mobileOpen={mobileSidebarOpen}
        onNavigate={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMobileMenuClick={() => setMobileSidebarOpen((p) => !p)} />
        <main className="flex-1 overflow-y-auto mx-auto w-full max-w-[1440px] px-3 pb-8 sm:px-5 md:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
