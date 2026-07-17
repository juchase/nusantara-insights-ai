"use client";

import { useState, useRef, useEffect } from "react";
import AvatarEditor from "react-avatar-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Loader2,
  User,
  Lock,
  Save,
  Camera,
  Trash2,
  Moon,
  Sun,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";

export default function ProfilePage() {
  const router = useRouter();

  // ── State Profil ──────────────────────────────────────────────────────────
  const [username, setUsername] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ── State Avatar ──────────────────────────────────────────────────────────
  const [image, setImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const editorRef = useRef<React.ElementRef<typeof AvatarEditor>>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State Tema ───────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // ── Inisialisasi tema dari localStorage ──────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  // ── Toggle tema ──────────────────────────────────────────────────────
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // ── Load data user ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      const res = await safeFetch<{
        name: string;
        avatar?: string;
        emailVerified: boolean;
      }>("/api/auth/me", { name: "", avatar: undefined, emailVerified: false });
      if (res) {
        setUsername(res.name || "");
        if (res.avatar) setCroppedImage(res.avatar);
        setEmailVerified(res.emailVerified);
      }
    };
    loadUser();
  }, []);

  // ── Handle file upload ──────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ── Crop & Preview ──────────────────────────────────────────────────────
  const handleCrop = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      setCroppedImage(canvas.toDataURL("image/png"));
    }
  };

  // ── Simpan Avatar ──────────────────────────────────────────────────────
  const handleSaveAvatar = async () => {
    if (!croppedImage) return;
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: croppedImage }),
      });
      if (!res.ok) throw new Error("Gagal upload avatar");

      const saved = localStorage.getItem("nusantara_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.avatar = croppedImage;
        localStorage.setItem("nusantara_settings", JSON.stringify(parsed));
      }

      setMessage({ type: "success", text: "Foto profil berhasil diperbarui" });
      setTimeout(() => setMessage(null), 5000);
      window.dispatchEvent(new Event("avatar-updated"));

      // Reset card
      setImage(null);
      setCroppedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setMessage({ type: "error", text: "Gagal upload avatar" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Hapus Foto Profil ──────────────────────────────────────────────────
  const handleDeleteAvatar = async () => {
    if (!confirm("Hapus foto profil?")) return;
    const res = await fetch("/api/user/avatar", { method: "DELETE" });
    if (res.ok) {
      const saved = localStorage.getItem("nusantara_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.avatar;
        localStorage.setItem("nusantara_settings", JSON.stringify(parsed));
      }
      setCroppedImage(null);
      setImage(null);
      window.dispatchEvent(new Event("avatar-updated"));
      setMessage({ type: "success", text: "Foto profil dihapus" });
    }
  };

  // ── Simpan Profil (Nama & Password) ────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok" });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      if (!res.ok) throw new Error("Gagal update profil");
      setMessage({ type: "success", text: "Profil berhasil diperbarui" });
      setTimeout(() => setMessage(null), 5000);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.dispatchEvent(new Event("avatar-updated"));
    } catch (error) {
      setMessage({ type: "error", text: "Gagal update profil" });
    } finally {
      setSaving(false);
    }
  };

  // ── Logout semua perangkat ─────────────────────────────────────────────
  const handleLogoutAll = async () => {
    if (!confirm("Logout dari semua perangkat?")) return;
    await fetch("/api/user/logout-all", { method: "POST" });
    window.location.href = "/login";
  };

  // ── Hapus Akun ──────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!confirm("Hapus akun? Tindakan ini tidak dapat dibatalkan.")) return;
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      localStorage.removeItem("nusantara_settings");
      window.location.href = "/login";
    }
  };

  // ── Kirim ulang verifikasi email ──────────────────────────────────────
  const handleResendVerification = async () => {
    await fetch("/api/user/verify/resend", { method: "POST" });
    setMessage({ type: "success", text: "Email verifikasi dikirim ulang" });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 bg-background text-foreground">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Profil</h1>
        <p className="text-sm text-muted mt-1">
          Kelola foto profil, nama tampilan, keamanan, dan preferensi Anda.
        </p>
      </div>

      {/* ─── PESAN STATUS ──────────────────────────────────────────────────── */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium ${
            message.type === "success"
              ? "border-secondary/20 bg-secondary/10 text-secondary"
              : "border-danger/20 bg-danger/10 text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ─── FOTO PROFIL ──────────────────────────────────────────────────── */}
      <section className="glass-card border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Camera size={16} className="text-muted" /> Foto Profil
        </h2>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="shrink-0">
            <div className="w-32 h-32 rounded-full bg-card border-2 border-border overflow-hidden flex items-center justify-center">
              {croppedImage ? (
                <img
                  src={croppedImage}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-muted" />
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-card file:text-foreground hover:file:bg-card-hover"
            />

            {image && (
              <div className="space-y-3">
                <AvatarEditor
                  ref={editorRef}
                  image={image}
                  width={200}
                  height={200}
                  border={10}
                  borderRadius={100}
                  scale={1.2}
                  rotate={0}
                />
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleCrop} variant="outline" size="sm">
                    Crop & Preview
                  </Button>
                  <Button
                    onClick={handleSaveAvatar}
                    disabled={uploadingAvatar || !croppedImage}
                    size="sm"
                    className="bg-primary text-background hover:bg-primary/80"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      "Simpan Foto"
                    )}
                  </Button>
                </div>
              </div>
            )}
            {croppedImage && !image && (
              <Button
                onClick={handleDeleteAvatar}
                variant="destructive"
                size="sm"
                className="gap-2 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20"
              >
                <Trash2 size={14} /> Hapus Foto
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ─── EMAIL VERIFIKASI ────────────────────────────────────────────────── */}
      <section className="glass-card border border-border p-6 space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Email</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className={emailVerified ? "text-secondary" : "text-muted"}>
            {emailVerified ? "✅ Terverifikasi" : "❌ Belum terverifikasi"}
          </span>
          {!emailVerified && (
            <button
              onClick={handleResendVerification}
              className="text-primary hover:underline text-xs"
            >
              Kirim ulang verifikasi
            </button>
          )}
        </div>
      </section>

      {/* ─── DATA DIRI ────────────────────────────────────────────────── */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <section className="glass-card border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Data Diri</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1">
                Nama Tampilan
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-card border-border text-foreground placeholder:text-muted"
                  placeholder="Nama Anda"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── GANTI PASSWORD ────────────────────────────────────────────────── */}
        <section className="glass-card border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock size={16} className="text-muted" /> Ganti Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1">
                Password Saat Ini
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">
                Password Baru
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">
                Konfirmasi Password Baru
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted"
                placeholder="••••••••"
              />
            </div>
          </div>
        </section>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/80 text-background font-bold"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </form>

      {/* ─── PREFERENSI ────────────────────────────────────────────────────── */}
      <section className="glass-card border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Preferensi</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Mode Tema</span>
          <button
            onClick={toggleTheme}
            className="h-7 w-12 rounded-full bg-card border border-border relative"
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-foreground transition-all ${
                theme === "dark" ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === "dark" ? "Gelap" : "Terang"}</span>
        </div>
      </section>

      {/* ─── KEAMANAN ────────────────────────────────────────────────────── */}
      <section className="glass-card border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <LogOut size={16} className="text-muted" /> Keamanan
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleLogoutAll}
            className="text-sm text-primary hover:underline"
          >
            Logout dari semua perangkat
          </button>
          <div className="border-t border-border pt-3">
            <button
              onClick={handleDeleteAccount}
              className="text-sm text-danger hover:text-danger/80"
            >
              <AlertTriangle size={14} className="inline mr-1" />
              Hapus Akun
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
