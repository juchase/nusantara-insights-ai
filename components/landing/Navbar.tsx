"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-[#1e293b]">
          <span className="text-indigo-600">✦</span> NusantaraInsight AI
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
          <Link href="#" className="text-indigo-600">
            Solutions
          </Link>
          <Link href="#" className="hover:text-indigo-600 transition">
            Pricing
          </Link>
          <Link href="#" className="hover:text-indigo-600 transition">
            About
          </Link>
          <Link href="#" className="hover:text-indigo-600 transition">
            Contact
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600">
            Login
          </Link>
          <Link href="/register">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
