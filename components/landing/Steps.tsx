"use client";

import { motion } from "framer-motion";
import { FileText, Cpu, Rocket } from "lucide-react";
import Link from "next/link";

export default function StepsSection() {
  const steps = [
    {
      icon: <FileText size={24} />, // Ukuran icon sedikit diperkecil
      title: "User Upload",
      desc: "Upload marketplace exports or connect directly via API.",
      color: "bg-indigo-600",
      glow: "shadow-[0_0_30px_rgba(79,70,229,0.5)]",
    },
    {
      icon: <Cpu size={24} />,
      title: "AI Processing",
      desc: "Our neural networks process patterns, distilling data into meaning.",
      color: "bg-emerald-400 text-slate-900",
      glow: "shadow-[0_0_40px_rgba(52,211,153,0.6)]",
      isCenter: true,
    },
    {
      icon: <Rocket size={24} />,
      title: "Business Insights",
      desc: "Access your dashboard with real-time recommendations.",
      color: "bg-indigo-600",
      glow: "shadow-[0_0_30px_rgba(79,70,229,0.5)]",
    },
  ];

  return (
    // Menggunakan min-h-screen dan flex flex-col untuk kontrol penuh tinggi layar
    <section className=" bg-[#0f172a] text-white rounded-t-[3.5rem] relative overflow-hidden flex flex-col justify-between pt-20 pb-10">
      {/* BACKGROUND DECOR */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-900/20 blur-[100px] rounded-full" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-900/10 blur-[100px] rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex flex-col flex-1">
        {/* HEADER STEPS - Margin dikurangi agar efisien */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">
            Three Steps to Intelligence
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
            Seamless integration into your current business workflow.
          </p>
        </div>

        {/* STEPS CONTENT - Menggunakan flex-1 agar mengambil ruang tengah */}
        <div className="relative mb-20 flex flex-col justify-center">
          {/* THE GLOWING LINE - Posisi disesuaikan dengan icon baru */}
          <div className="absolute top-9 left-0 w-full flex justify-center pointer-events-none hidden md:flex">
            <div className="w-[60%] h-px bg-linear-to-r from-transparent via-emerald-400 to-transparent opacity-30" />
            <div className="absolute w-[60%] h-px bg-linear-to-r from-transparent via-emerald-400 to-transparent blur-[2px] opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center group text-center"
              >
                <motion.div
                  initial={step.isCenter ? { scale: 1 } : {}}
                  animate={step.isCenter ? { scale: [1, 1.05, 1] } : {}}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center relative z-20 transition-transform duration-300 group-hover:scale-110 ${step.color} ${step.glow}`}
                >
                  {step.icon}
                </motion.div>

                <div className="mt-6 md:mt-8">
                  <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-3">
                    {step.title}
                  </h4>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-[240px] md:max-w-[280px] mx-auto">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REFACTORED FOOTER - Dibuat lebih rapat agar tidak memakan layar */}
        <footer className="px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="text-indigo-400">✦</span>
              <span>NusantaraInsight AI</span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                API Docs
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Security
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.15em] font-medium text-center md:text-left">
              © 2024 NusantaraInsight AI. Architectural Intelligence.
            </p>

            <div className="flex items-center gap-1 bg-white/5 px-3 py-2 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Status: <span className="text-slate-200">Operational</span>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
