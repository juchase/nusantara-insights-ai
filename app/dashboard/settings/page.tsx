"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Brain,
  Database,
  ShieldCheck,
  SlidersHorizontal,
  Info,
  User,
  Camera,
} from "lucide-react";

// ── TIPE DATA SETTINGS ──────────────────────────────────────────────
type Settings = {
  autoInsight: boolean;
  forecastRefresh: boolean;
  alertEnabled: boolean;
  avatar?: string | null; // Base64 atau URL gambar
};

// ── KOMPONEN TOGGLE ────────────────────────────────────────────────
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card/60 text-muted">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-card"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-background transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

// ── KOMPONEN FIELD STATIC ──────────────────────────────────────────
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
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={`mt-2 text-sm ${muted ? "text-muted" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

export default function SettingsPage() {
  // ── STATE ──────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<Settings>({
    autoInsight: true,
    forecastRefresh: true,
    alertEnabled: false,
    avatar: null,
  });

  // ── LOAD SETTINGS DARI LOCALSTORAGE ──────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("nusantara_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Gagal memuat settings", e);
      }
    }
  }, []);

  // ── UPDATE SETTINGS & SIMPAN KE LOCALSTORAGE ────────────────────
  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem("nusantara_settings", JSON.stringify(newSettings));
      return newSettings;
    });
  };

  // ── HANDLE UPLOAD AVATAR ──────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB.");
      return;
    }

    // Konversi ke base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      updateSetting("avatar", result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // ── RENDER ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1000px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6 bg-background text-foreground">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Workspace Control
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Konfigurasi tampilan dashboard, otomasi analitik, dan status layanan
          yang digunakan Nusantara Insights AI.
        </p>
      </div>

      {/* ─── BAGIAN FOTO PROFIL ────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <User size={17} className="text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Foto Profil</h2>
        </div>
        <div className="glass-card border border-border p-5 flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-full bg-card border-2 border-border flex items-center justify-center overflow-hidden">
              {avatarPreview || settings.avatar ? (
                <img
                  src={avatarPreview || settings.avatar || ""}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={32} className="text-muted" />
              )}
            </div>
            <button
              onClick={triggerFileInput}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/80 text-background flex items-center justify-center border-2 border-background transition-colors"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Ubah Foto Profil
            </p>
            <p className="text-xs text-muted">
              Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.
            </p>
          </div>
        </div>
      </section>

      {/* ─── PREFERENSI ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={17} className="text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Preferensi</h2>
        </div>

        <ToggleRow
          icon={<Brain size={18} />}
          title="Generate AI Insight otomatis"
          description="Meminta insight terbaru saat produk aktif berubah di dashboard."
          enabled={settings.autoInsight}
          onChange={(val) => updateSetting("autoInsight", val)}
        />
        <ToggleRow
          icon={<Database size={18} />}
          title="Refresh prediksi permintaan"
          description="Mengambil hasil forecast terbaru ketika halaman Forecast dibuka."
          enabled={settings.forecastRefresh}
          onChange={(val) => updateSetting("forecastRefresh", val)}
        />
        <ToggleRow
          icon={<Bell size={18} />}
          title="Notifikasi risiko tinggi"
          description="Menandai produk dengan risiko tinggi untuk pemantauan lanjutan."
          enabled={settings.alertEnabled}
          onChange={(val) => updateSetting("alertEnabled", val)}
        />
      </section>

      {/* ─── STATUS SISTEM ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} className="text-muted" />
          <h2 className="text-sm font-semibold text-foreground">
            Status sistem
          </h2>
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

      {/* ─── TENTANG SISTEM ─────────────────────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-muted" />
          <h2 className="text-[15px] font-medium text-foreground">
            Tentang Sistem
          </h2>
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
              <span className="text-sm text-muted">{item.label}</span>
              <span className="text-sm font-medium text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
