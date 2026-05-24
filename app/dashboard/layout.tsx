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

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6ff", display: "flex" }}>
      <Sidebar collapsed={collapsed} />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: collapsed ? 64 : 232,
          transition: "margin-left 0.22s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <Topbar onMenuClick={() => setCollapsed((p) => !p)} />
        <main
          style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px 40px" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
