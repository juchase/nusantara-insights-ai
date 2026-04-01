"use client";

import { Bell, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Topbar() {
  return (
    <header className="fixed top-0 right-0 left-64 bg-white/80 backdrop-blur border-b px-8 py-4 flex justify-between items-center z-40">
      {/* Search */}
      <div className="flex items-center px-4 py-2 rounded-full w-96">
        <Input
          placeholder="Search datasets, reports..."
          className="border-none bg-gray-100 focus-visible:ring-0"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/upload">
          <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
            <Upload size={16} />
            Upload Dataset
          </Button>
        </Link>

        <button className="p-2 hover:bg-gray-100 rounded-full">
          <Bell size={18} />
        </button>

        <div className="w-9 h-9 rounded-full bg-gray-300" />
      </div>
    </header>
  );
}
