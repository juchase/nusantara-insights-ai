"use client";

import { useState } from "react";
import {
  Bell,
  Brain,
  Database,
  ShieldCheck,
  SlidersHorizontal,
  Info,
} from "lucide-react";

function ToggleRow({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="glass-card border border-border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e293b]/60 text-slate-400">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-[#F59E0B]" : "bg-[#1e293b]"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SettingField({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="glass-card border border-border px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-sm ${muted ? "text-slate-500" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [autoInsight, setAutoInsight] = useState(true);
  const [forecastRefresh, setForecastRefresh] = useState(true);
  const [alertEnabled, setAlertEnabled] = useState(false);

  return (
    <div className="mx-auto max-w-[1000px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
          Workspace Control
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">Pengaturan</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Konfigurasi tampilan dashboard, otomasi analitik, dan status layanan
          yang digunakan Nusantara Insights AI.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={17} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Preferensi</h2>
        </div>

        <ToggleRow
          icon={<Brain size={18} />}
          title="Generate AI Insight otomatis"
          description="Meminta insight terbaru saat produk aktif berubah di dashboard."
          enabled={autoInsight}
          onChange={setAutoInsight}
        />
        <ToggleRow
          icon={<Database size={18} />}
          title="Refresh prediksi permintaan"
          description="Mengambil hasil forecast terbaru ketika halaman Forecast dibuka."
          enabled={forecastRefresh}
          onChange={setForecastRefresh}
        />
        <ToggleRow
          icon={<Bell size={18} />}
          title="Notifikasi risiko tinggi"
          description="Menandai produk dengan risiko tinggi untuk pemantauan lanjutan."
          enabled={alertEnabled}
          onChange={setAlertEnabled}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Status sistem</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SettingField label="Frontend" value="Next.js dashboard" />
          <SettingField label="Database" value="PostgreSQL via Prisma" />
          <SettingField label="AI service" value="http://127.0.0.1:8000" />
          <SettingField
            label="Demand model"
            value="FastAPI predict-demand endpoint"
          />
          <SettingField
            label="Insight engine"
            value="Rule Engine + LLM fallback"
          />
          <SettingField
            label="Persistence"
            value="Preferensi lokal halaman ini"
            muted
          />
        </div>
      </section>

      {/* Tentang Sistem */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-slate-400" />
          <h2 className="text-[15px] font-medium text-white">Tentang Sistem</h2>
        </div>
        <div className="glass-card border border-border p-5">
          {[
            { label: "Nama Sistem", value: "NusantaraInsight AI" },
            { label: "Versi", value: "1.0.0 — Sprint 7" },
            { label: "Arsitektur AI", value: "Hybrid Rule Engine + Local LLM" },
            {
              label: "Sentiment Model",
              value: "Logistic Regression + TF-IDF Vectorizer",
            },
            {
              label: "Forecast Model",
              value: "Adaptive Polynomial Regression (degree 1-3)",
            },
            { label: "LLM", value: "Qwen2.5-1.5B via LM Studio (offline)" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex justify-between items-center py-3 border-b border-border last:border-0"
            >
              <span className="text-sm text-slate-400">{item.label}</span>
              <span className="text-sm font-medium text-white">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
