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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r flex flex-col p-4">
      {/* Logo */}
      <div className="mb-6">
        <h1 className="font-bold text-lg">NusantaraInsight</h1>
        <p className="text-xs text-gray-400 uppercase">AI Intelligence</p>
      </div>

      {/* Menu */}
      <nav className="space-y-2 flex-1">
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-semibold">
          <LayoutDashboard size={18} />
          Executive Summary
        </div>

        <div className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
          <BarChart3 size={18} />
          Data Explorer
        </div>

        <div className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
          <Sparkles size={18} />
          AI Insights
        </div>

        <div className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer">
          <Settings size={18} />
          Settings
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="space-y-3 border-t py-6">
        <div className="bg-indigo-50 p-3 rounded-lg text-xs">
          <p className="font-bold text-indigo-600 mb-2">PRO PLAN ACTIVE</p>
          <Button className="w-full bg-indigo-600 text-white py-1 rounded-md text-xs">
            Upgrade
          </Button>
        </div>

        <Button className="flex items-center justify-start gap-2 text-sm bg-gray-200 text-gray-500 hover:text-gray-500 hover:bg-gray-300 w-full">
          <HelpCircle size={16} />
          Help Center
        </Button>

        <Button
          onClick={handleLogout}
          className="flex items-center justify-start gap-2 text-sm bg-gray-200 text-gray-500 hover:text-red-500 hover:bg-gray-300 w-full"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </aside>
  );
}
