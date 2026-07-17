"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validateFile = (selectedFile: File) => {
    const isCorrect =
      selectedFile.type === "text/csv" ||
      selectedFile.name.toLowerCase().endsWith(".csv") ||
      selectedFile.name.toLowerCase().endsWith(".xlsx");

    if (!isCorrect) {
      return "Format berkas tidak valid. Harap gunakan ekstensi .csv atau .xlsx";
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      return "Ukuran berkas terlalu besar. Batas maksimal adalah 5MB";
    }

    return null;
  };

  const handleFileChange = (targetFile: File) => {
    setErrorMessage("");
    setSuccessMessage("");

    const error = validateFile(targetFile);
    if (error) {
      setErrorMessage(error);
      setFile(null);
      return;
    }

    setFile(targetFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-dataset", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      setSuccessMessage("Dataset berhasil diunggah dan dianalisis 🎉");
      setFile(null);

      // ── KIRIM EVENT KE TOPBAR ──────────────────────────────────────────────
      window.dispatchEvent(new Event("notifications-updated"));

      // Refresh & redirect otomatis ke dashboard kerja
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch {
      setErrorMessage(
        "Gagal memproses berkas dataset. Silakan periksa struktur data Anda ❌",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background font-sans text-foreground antialiased flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Batas Kontainer Utama */}
      <div className="mx-auto w-full max-w-xl">
        {/* Navigasi Kembali */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition mb-6"
        >
          <ArrowLeft size={14} />
          Kembali ke Dasbor
        </Link>

        {/* Judul Utama */}
        <div className="mb-8 text-left">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Unggah Berkas Dataset
          </h1>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Sistem intelijen bisnis kami akan memproses data ulasan transaksi
            lokal secara instan lewat algoritma analitik internal sandbox.
          </p>
        </div>

        {/* Area Kotak Dropzone Interaktif */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) handleFileChange(droppedFile);
          }}
          className={`group relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
            dragging
              ? "bg-primary/10 border-primary shadow-inner"
              : file
                ? "bg-secondary/10 border-secondary/60 shadow-sm"
                : "glass border-border hover:bg-card hover:border-primary/40"
          }`}
        >
          {/* Sembunyikan elemen input asli */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileChange(selectedFile);
            }}
          />

          {/* Render Ikon Dinamis */}
          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 mb-4 bg-card border-border">
            {file ? (
              <FileSpreadsheet className="text-secondary" size={22} />
            ) : (
              <UploadCloud
                className="text-muted group-hover:text-primary"
                size={22}
              />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {file ? file.name : "Seret & jatuhkan berkas di sini"}
            </p>
            <p className="text-xs text-muted font-medium">
              {file
                ? `Ukuran kapasitas dokumen: ${(file.size / 1024).toFixed(1)} KB`
                : "Mendukung format ekstensi .CSV atau .XLSX (Maksimal 5MB)"}
            </p>
          </div>
        </div>

        {/* Manajemen Banner Pesan Dinamis */}
        <div className="mt-4 min-h-[40px]">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-xs font-semibold text-danger animate-fadeIn">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-xs font-semibold text-secondary animate-fadeIn">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Tombol Eksekusi Upload */}
        <Button
          onClick={handleUpload}
          disabled={loading || !file}
          className="w-full h-11 bg-primary hover:bg-primary/80 text-background font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              Memproses Analisis AI...
            </>
          ) : (
            "Mulai Analisis Dataset"
          )}
        </Button>

        {/* Petunjuk Tambahan Skema Kolom - Versi Template Eksplisit */}
        <div className="mt-8 pt-6 border-t border-border text-left">
          <div className="mb-4">
            <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Format Dataset yang Didukung
            </h4>
            <p className="mt-1 text-xs text-muted leading-relaxed font-medium">
              Sistem dapat memproses data dari satu file CSV (gabungan) atau dua
              file terpisah. Pastikan header kolom Anda sesuai dengan contoh di
              bawah ini (nama kolom bersifat case-insensitive).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Kartu 1: Data Ulasan */}
            <div className="glass-card border border-border p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                📝 Data Ulasan (Review)
              </p>
              <p className="text-[10px] text-muted mb-3">
                Untuk analisis sentimen & distribusi.
              </p>
              <div className="bg-card p-3 rounded-lg border border-border">
                <p className="text-[11px] font-mono text-foreground">
                  <span className="text-primary">review_text</span>, rating,
                  review_date
                </p>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] text-muted flex items-center gap-1.5">
                  <span className="text-primary">*</span> review_text: Teks
                  ulasan pelanggan (wajib)
                </p>
                <p className="text-[10px] text-muted flex items-center gap-1.5">
                  <span className="text-secondary">•</span> rating: Nilai 1-5
                  (opsional)
                </p>
                <p className="text-[10px] text-muted flex items-center gap-1.5">
                  <span className="text-secondary">•</span> review_date: Tanggal
                  ulasan (opsional)
                </p>
              </div>
            </div>

            {/* Kartu 2: Data Penjualan */}
            <div className="glass-card border border-border p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                📊 Data Penjualan (Sales)
              </p>
              <p className="text-[10px] text-muted mb-3">
                Untuk prediksi permintaan & tren.
              </p>
              <div className="bg-card p-3 rounded-lg border border-border">
                <p className="text-[11px] font-mono text-foreground">
                  product, date, <span className="text-primary">quantity</span>,
                  unit_price
                </p>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] text-muted flex items-center gap-1.5">
                  <span className="text-primary">*</span> quantity: Jumlah
                  barang terjual (wajib)
                </p>
                <p className="text-[10px] text-muted flex items-center gap-1.5">
                  <span className="text-secondary">•</span> product: Nama produk
                  (opsional, jika kosong akan dibuat otomatis)
                </p>
                <p className="text-[10px] text-muted flex items-center gap-1.5">
                  <span className="text-secondary">•</span> date: Tanggal
                  transaksi (opsional)
                </p>
                <p className="text-[10px] text-muted flex items-center gap-1.5">
                  <span className="text-secondary">•</span> unit_price: Harga
                  per unit (opsional)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 glass-card border border-border p-3.5">
            <p className="text-[10px] text-muted flex items-center gap-2">
              <Info size={13} className="text-tertiary shrink-0" />
              Anda dapat menggabungkan semua kolom di atas dalam satu file .CSV.
              Sistem akan otomatis memisahkan data ulasan dan penjualan
              berdasarkan nama header kolom.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
