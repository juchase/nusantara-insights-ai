"use client";
import {
  Bell,
  Menu,
  Search,
  Upload,
  Settings,
  LogOut,
  X,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import DemoCountdown from "@/components/dashboard/DemoCountdown";
import { safeFetch } from "@/lib/safe-fetch";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: string;
};

export default function Topbar({
  onMobileMenuClick,
}: {
  onMobileMenuClick: () => void;
}) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const loadAvatar = () => {
      const saved = localStorage.getItem("nusantara_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.avatar) setAvatar(parsed.avatar);
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadAvatar();

    window.addEventListener("avatar-updated", loadAvatar);
    return () => window.removeEventListener("avatar-updated", loadAvatar);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      const res = await safeFetch<{ data: Notification[] }>(
        "/api/notifications",
        { data: [] },
      );
      setNotifications(res.data);
    };

    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: null }),
    });
  };

  const removeNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else {
        console.error("Gagal menghapus notifikasi");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const clearAll = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
      } else {
        console.error("Gagal menghapus semua notifikasi");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getTimeAgo = (isoString: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const toggleDropdown = () => setIsAvatarDropdownOpen((prev) => !prev);

  return (
    <header className="sticky top-0 z-20 h-16 w-full glass border-b bg-background border-border flex items-center justify-between px-3 sm:px-5 lg:px-6 gap-4">
      {/* KIRI: Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMobileMenuClick}
          className="flex items-center justify-center sm:hidden w-9 h-9 rounded-xl border border-border bg-card/40 text-muted hover:text-foreground hover:bg-card transition-colors shrink-0"
        >
          <Menu size={16} />
        </button>

        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-[320px] h-9 bg-card/60 border border-border rounded-xl px-3 transition-colors focus-within:border-primary focus-within:bg-card">
          <Search size={14} className="text-muted shrink-0" />
          <input
            placeholder="Cari dataset, laporan..."
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder-muted"
          />
        </div>
      </div>

      {/* KANAN: Demo Countdown, Upload, Notifications, Avatar */}
      <div className="flex items-center gap-3 shrink-0 relative">
        <DemoCountdown />

        {/* Upload Dataset */}
        <Link
          href="/dashboard/upload"
          className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-background text-xs font-bold hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20"
        >
          <Upload size={14} />
          Upload Dataset
        </Link>
        <Link
          href="/dashboard/upload"
          className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-background hover:bg-primary/80 transition-colors"
        >
          <Upload size={14} />
        </Link>

        <div className="hidden sm:block w-px h-4 bg-border" />

        {/* ─── NOTIFICATIONS ────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative w-9 h-9 rounded-xl border border-border bg-card/40 text-muted hover:text-foreground hover:bg-card transition-colors flex items-center justify-center"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-[9px] flex items-center justify-center text-white border-2 border-background font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Notifikasi */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card border border-border rounded-xl shadow-xl z-30 overflow-hidden flex flex-col max-h-[400px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">
                  Notifikasi
                </p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline transition"
                    >
                      Tandai semua telah dibaca
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted hover:text-danger transition"
                    >
                      Hapus semua
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted">
                    Tidak ada notifikasi
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-4 hover:bg-card/40 transition-colors relative ${
                        notif.read ? "opacity-60" : ""
                      }`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      {!notif.read && (
                        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted mt-1">
                          {getTimeAgo(notif.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        className="shrink-0 text-muted hover:text-danger transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block w-px h-4 bg-border" />

        {/* ─── AVATAR + DROPDOWN ────────────────────────────────── */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-background cursor-pointer hover:opacity-90 transition-opacity overflow-hidden ring-2 ring-border"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              "NI"
            )}
          </button>

          {isAvatarDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-card border border-border rounded-lg p-1 shadow-xl z-30">
              <Link
                href="/dashboard/profile"
                onClick={() => setIsAvatarDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-card rounded transition-colors"
              >
                <User size={14} />
                Edit Profil
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setIsAvatarDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-card rounded transition-colors"
              >
                <Settings size={14} />
                Pengaturan
              </Link>
              <button
                onClick={() => {
                  setIsAvatarDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded transition-colors"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
