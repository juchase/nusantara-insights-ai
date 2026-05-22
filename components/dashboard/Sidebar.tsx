"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-indigo-100 bg-[#eef0ff] p-5 shadow-sm backdrop-blur-xl lg:flex">
      {/* Logo */}
      <div className="mb-8 px-2 pt-2">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
          NI
        </div>
        <h1 className="text-lg font-bold tracking-tight text-slate-950">
          NusantaraInsight
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          AI Intelligence
        </p>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1.5">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-indigo-700 shadow-sm">
          <LayoutDashboard size={18} />
          Executive Summary
        </div>

        <div className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-slate-500 transition hover:bg-white/70 hover:text-slate-900">
          <BarChart3 size={18} />
          Data Explorer
        </div>

        <div className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-slate-500 transition hover:bg-white/70 hover:text-slate-900">
          <Sparkles size={18} />
          AI Insights
        </div>

        <div className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-slate-500 transition hover:bg-white/70 hover:text-slate-900">
          <Settings size={18} />
          Settings
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="space-y-3 border-t border-slate-200 py-6">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-xs">
          <p className="mb-1 font-bold text-indigo-700">PRO PLAN ACTIVE</p>
          <p className="mb-3 leading-relaxed text-indigo-600/80">
            Realtime AI analytics ready for thesis demo.
          </p>
          <Button className="h-8 w-full rounded-full bg-indigo-600 text-xs text-white hover:bg-indigo-700">
            Upgrade
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <HelpCircle size={16} />
          Help Center
        </Button>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-slate-500 hover:text-red-600"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </aside>
  );
}
