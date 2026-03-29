"use client";

import { Smile, BarChart3, Lightbulb } from "lucide-react";

export default function Features() {
  const feats = [
    {
      title: "Sentiment Analysis",
      desc: "Understand the 'Why' behind your customer ratings. We categorize emotions and pinpoint specific product pain points instantly.",
      icon: <Smile className="text-indigo-600" />,
    },
    {
      title: "Demand Forecasting",
      desc: "Never run out of stock or over-order again. Our AI models predict next month's demand based on social trends and historical data.",
      icon: <BarChart3 className="text-indigo-600" />,
    },
    {
      title: "AI Insight Generator",
      desc: "Receive daily strategic recommendations. 'Launch a Spicy Variant' or 'Improve Packing Durability' - direct advice for your business.",
      icon: <Lightbulb className="text-indigo-600" />,
    },
  ];

  return (
    <section className="py-20 bg-white text-center">
      <div className="max-w-4xl mx-auto mb-20 px-6">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
          Built for Precise Intelligence
        </h2>
        <p className="text-gray-500">
          Enterprise-grade AI tools tailored specifically for the Indonesian
          UMKM ecosystem.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-6">
        {feats.map((f, i) => (
          <div
            key={i}
            className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 text-left"
          >
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
              {f.icon}
            </div>
            <h3 className="font-bold text-xl mb-4 text-slate-900">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
