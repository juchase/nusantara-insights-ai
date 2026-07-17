"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  MapPin,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Simulasi pengiriman pesan kontak
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-background text-foreground antialiased py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
        {/* KOLOM KIRI: Informasi Kontak Fisik & WhatsApp */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition mb-10"
          >
            <ArrowLeft size={14} />
            Kembali
          </Link>

          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Hubungi Kami
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed max-w-sm">
            Butuh bantuan teknis terkait instalasi lokal atau ingin
            berkonsultasi mengenai paket premium? Tim kami siap mendampingi
            Anda.
          </p>

          {/* List Detail Informasi */}
          <div className="mt-10 space-y-6">
            <a
              href="https://wa.me"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-4 p-4 rounded-2xl glass border border-border hover:bg-card/80 transition"
            >
              <div className="w-10 h-10 bg-secondary/15 border border-secondary/20 text-secondary rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare size={18} />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm mb-0.5">
                  WhatsApp Business
                </h4>
                <p className="text-muted text-xs font-medium leading-none mb-1">
                  +62 812-3456-7890
                </p>
                <p className="text-primary text-[11px] font-bold group-hover:underline">
                  Respon cepat via Chat &rarr;
                </p>
              </div>
            </a>

            <div className="flex gap-4 p-4">
              <div className="w-10 h-10 bg-card border border-border text-muted rounded-xl flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm mb-0.5">
                  Email Dukungan Resmi
                </h4>
                <p className="text-muted text-xs font-medium">
                  support@nusantarainsight.ai
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4">
              <div className="w-10 h-10 bg-card border border-border text-muted rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm mb-0.5">
                  Lokasi Kantor Pusat
                </h4>
                <p className="text-muted text-xs font-medium leading-relaxed max-w-xs">
                  Gedung Nusantara Tekno, Lantai 3, Banjarbaru, Kalimantan
                  Selatan, Indonesia.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Formulir Pesan Masukan (Glassmorphism) */}
        <div className="lg:border-l lg:border-border lg:pl-12 w-full pt-8 lg:pt-17">
          <h3 className="font-bold text-foreground text-lg mb-6">
            Kirim Pesan Langsung
          </h3>

          <form className="space-y-4" onSubmit={handleSendMessage}>
            {isSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-xs font-semibold text-secondary">
                <CheckCircle2 size={16} />
                Pesan Anda berhasil dikirim. Tim kami akan segera menghubungi
                lewat email.
              </div>
            )}

            <div>
              <label
                htmlFor="contact-name"
                className="text-xs font-bold text-muted"
              >
                Nama Lengkap Anda
              </label>
              <input
                id="contact-name"
                type="text"
                required
                className="w-full mt-1.5 rounded-xl bg-card border border-border px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="E.g., Hendra Wijaya"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="text-xs font-bold text-muted"
              >
                Alamat Email Aktif
              </label>
              <input
                id="contact-email"
                type="email"
                required
                className="w-full mt-1.5 rounded-xl bg-card border border-border px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="hendra@bisnisku.id"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="text-xs font-bold text-muted"
              >
                Isi Pesan / Pertanyaan
              </label>
              <textarea
                id="contact-message"
                rows={4}
                required
                className="w-full mt-1.5 rounded-xl bg-card border border-border px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                placeholder="Tuliskan pertanyaan atau kendala integrasi sistem Anda di sini..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              disabled={isSending}
              className="w-full h-11 bg-primary hover:bg-primary/80 text-background font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Sedang Mengirim...
                </>
              ) : (
                "Kirim Pesan Sekarang"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
