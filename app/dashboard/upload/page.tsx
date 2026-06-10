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
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Batas Kontainer Utama */}
      <div className="mx-auto w-full max-w-xl">
        {/* Navigasi Kembali */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition mb-6"
        >
          <ArrowLeft size={14} />
          Kembali ke Dasbor
        </Link>

        {/* Judul Utama */}
        <div className="mb-8 text-left">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Unggah Berkas Dataset
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
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
              ? "bg-indigo-50/70 border-indigo-500 shadow-inner"
              : file
                ? "bg-emerald-50/30 border-emerald-500/60 shadow-sm"
                : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-300"
          }`}
        >
          {/* Sembunyikan elemen input asli bawaan browser agar visual rapi */}
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

          {/* Render Ikon Dinamis Mengikuti Status Berkas */}
          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 mb-4 bg-white shadow-sm border-slate-100">
            {file ? (
              <FileSpreadsheet className="text-emerald-600" size={22} />
            ) : (
              <UploadCloud
                className="text-slate-400 group-hover:text-indigo-600"
                size={22}
              />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">
              {file ? file.name : "Seret & jatuhkan berkas di sini"}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {file
                ? `Ukuran kapasitas dokumen: ${(file.size / 1024).toFixed(1)} KB`
                : "Mendukung format ekstensi .CSV atau .XLSX (Maksimal 5MB)"}
            </p>
          </div>
        </div>

        {/* Manajemen Banner Pesan Dinamis */}
        <div className="mt-4 min-h-[40px]">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-xs font-semibold text-red-600 animate-fadeIn">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-xs font-semibold text-emerald-600 animate-fadeIn">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Tombol Eksekusi Upload */}
        <Button
          onClick={handleUpload}
          disabled={loading || !file}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
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

        {/* Petunjuk Tambahan Skema Kolom (UX Guardrail) */}
        <div className="mt-8 pt-6 border-t border-slate-200/60 text-left">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Rekomendasi Struktur Kolom Dataset
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Untuk hasil analisis interpretasi data terbaik, pastikan dokumen
            tabel Anda memiliki header kolom nama{" "}
            <code className="text-indigo-600 font-mono bg-indigo-50 px-1 py-0.5 rounded">
              ulasan
            </code>{" "}
            (untuk sentimen) dan{" "}
            <code className="text-indigo-600 font-mono bg-indigo-50 px-1 py-0.5 rounded">
              penjualan
            </code>{" "}
            (untuk data tren model regresi).
          </p>
        </div>
      </div>
    </main>
  );
}
