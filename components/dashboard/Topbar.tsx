"use client";

import { Bell, Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 -mx-4 mb-7 border-b border-slate-200/70 bg-[#f7f6ff]/85 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="hidden h-14 w-full max-w-lg items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-6 shadow-sm shadow-slate-200/50 md:flex">
          <Search size={16} className="text-slate-400" />
          <Input
            placeholder="Search datasets, reports..."
            className="h-8 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>

        {/* Right */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/upload"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 sm:px-5"
            style={{ backgroundColor: "#4f46e5", minWidth: 164 }}
            aria-label="Upload dataset"
          >
            <Upload size={16} />
            <span>Upload Dataset</span>
          </Link>

          <button className="grid size-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
            <Bell size={18} />
          </button>

          <div
            className="grid size-12 place-items-center rounded-full bg-linear-to-br from-indigo-600 to-cyan-500 text-sm font-semibold text-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
            }}
          >
            NI
          </div>
        </div>
      </div>
    </header>
  );
}
