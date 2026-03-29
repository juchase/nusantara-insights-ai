"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  const router = useRouter();

  const validateFile = (file: File) => {
    // 1. cek type (lebih aman dari extension)
    const isCorrect =
      file.type === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv") ||
      file.name.toLowerCase().endsWith(".xlsx");

    if (!isCorrect) {
      return "File harus berformat CSV atau XLSX";
    }

    // 2. cek size (max 5MB)
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return "Ukuran file maksimal 5MB";
    }

    return null;
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-dataset", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      setMessage("Upload berhasil 🎉");

      // 🔥 refresh dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage("Upload gagal ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-20 space-y-6">
      <h1 className="text-2xl font-bold text-center">Upload Dataset</h1>

      {/* Upload Box */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 text-center space-y-4 transition ${
          dragging ? "bg-indigo-50 border-indigo-400" : "hover:bg-gray-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);

          const droppedFile = e.dataTransfer.files[0];
          if (!droppedFile) return;

          const error = validateFile(droppedFile);

          if (error) {
            setMessage(error);
            setFile(null);
            return;
          }

          setFile(droppedFile);
          setMessage("");
        }}
      >
        <UploadCloud className="mx-auto text-gray-400" size={40} />

        <p className="text-sm text-gray-500">
          Upload file CSV atau XLSX untuk analisis
        </p>

        <input
          className="cursor-pointer"
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (!selectedFile) return;

            const error = validateFile(selectedFile);

            if (error) {
              setMessage(error);
              setFile(null);
              return;
            }

            setFile(selectedFile);
            setMessage("");
          }}
        />

        {file && (
          <p className="text-sm text-green-600">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {message && (
          <p className="text-center text-sm text-red-500">{message}</p>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full"
      >
        {loading ? "Uploading..." : "Upload Dataset"}
      </Button>
    </div>
  );
}
