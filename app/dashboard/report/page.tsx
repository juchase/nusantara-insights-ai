"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileOutput,
  Search,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { safeFetch } from "@/lib/safe-fetch";
import { mergeForecastData } from "@/lib/mergeForecastData";

type Product = {
  id: string;
  name: string;
  category: string | null;
  insights?: {
    healthScore: number;
    riskLevel: string;
    dominantIssue: string;
  }[];
  _count?: { reviews: number };
};

type SalesPoint = {
  date: string;
  quantity: number;
};
type PredictionPoint = {
  predictionDate: string;
  predictedSales: number;
};
type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
};

type PredictDemandResponse = {
  confidence: number;
  growth?: number;
  forecast_summary?: {
    avg: number;
    min: number;
    max: number;
    lower: number;
    upper: number;
  };
  model_used?: string;
  freq?: "D" | "W";
};

// Fallback linear forecast
function linearForecast(values: number[], forecastMonths = 3): number[] {
  const n = values.length;
  if (n < 2) return values.map(() => values[0] ?? 50);
  const x = values.map((_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * values[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const forecast = [];
  for (let i = 0; i < forecastMonths; i++) {
    forecast.push(slope * (n + i) + intercept);
  }
  return forecast;
}

// Menghitung growth dari data forecast
function calculateGrowth(data: ForecastPoint[]): number {
  const actual = data
    .filter((item) => item.actual)
    .map((item) => item.actual ?? 0);
  const predicted = data
    .filter((item) => item.predicted)
    .map((item) => item.predicted ?? 0);

  if (!actual.length || !predicted.length) return 0;

  const lastActual = actual[actual.length - 1];
  const avgPredicted =
    predicted.reduce((total, value) => total + value, 0) / predicted.length;

  if (lastActual === 0) return 0;
  return parseFloat(
    (((avgPredicted - lastActual) / lastActual) * 100).toFixed(1),
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await safeFetch<Product[]>("/api/products", []);
      setProducts(data);
      setLoading(false);
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      [p.name, p.category]
        .filter(Boolean)
        .some((v) => v?.toLowerCase().includes(term)),
    );
  }, [products, query]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  // ── GENERATE GAMBAR GRAFIK (hanya untuk PDF) ─────────────────
  async function generateChartImage(
    labels: string[],
    datasets: { label: string; data: number[]; color: string }[],
  ): Promise<string> {
    if (typeof window === "undefined") return "";

    if (typeof (window as any).Chart === "undefined") {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const Chart = (window as any).Chart;
    const container = document.createElement("div");
    container.style.width = "600px";
    container.style.height = "300px";
    container.style.backgroundColor = "#fff";
    container.style.padding = "16px";
    container.style.borderRadius = "8px";
    document.body.appendChild(container);

    const canvas = document.createElement("canvas");
    canvas.id = "tempChart";
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.color,
          tension: 0.2,
          pointBackgroundColor: ds.color,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    const imageData = canvas.toDataURL("image/png");
    chart.destroy();
    document.body.removeChild(container);
    return imageData;
  }

  // ── EKSPOR ─────────────────────────────────────────────────────
  const handleExport = async (format: "pdf" | "word" | "excel") => {
    if (selectedIds.size === 0) {
      alert("Silakan pilih minimal satu produk.");
      return;
    }

    setExporting(true);
    try {
      // 1. Ambil data produk + insight
      const selectedProducts = products.filter((p) => selectedIds.has(p.id));
      const insightPromises = selectedProducts.map(async (p) => {
        const data = await safeFetch<any>(`/api/insights/${p.id}`, null);
        return { ...p, insightData: data };
      });
      const productReports = await Promise.all(insightPromises);

      // 2. Ambil data forecasting dari API
      const forecastPromises = productReports.map(async (p) => {
        try {
          // a. Ambil metrik AI (confidence, growth, forecast_summary)
          const aiRes = await fetch(
            `http://localhost:8000/predict-demand/${p.id}`,
            {
              method: "POST",
            },
          );
          let aiData: PredictDemandResponse | null = null;
          if (aiRes.ok) {
            aiData = await aiRes.json();
          }

          // b. Ambil data penjualan & prediksi
          const salesData = await safeFetch<{
            sales: SalesPoint[];
            predictions: PredictionPoint[];
          }>(`/api/predictions/${p.id}`, { sales: [], predictions: [] });

          // c. Gabungkan data
          const merged = mergeForecastData(
            salesData.sales,
            salesData.predictions,
          ) as ForecastPoint[];

          // d. Hitung growth (jika tidak dari AI, hitung sendiri)
          let growth = aiData?.growth ?? calculateGrowth(merged);
          let confidence = aiData?.confidence ?? 0;
          let forecastSummary = aiData?.forecast_summary ?? null;

          // e. Ekstrak historis (actual) dan prediksi dari merged
          const historical = merged
            .filter((d) => d.actual !== null && d.actual !== undefined)
            .map((d) => d.actual!);
          const forecast = merged
            .filter((d) => d.predicted !== null && d.predicted !== undefined)
            .map((d) => d.predicted!);

          return {
            productId: p.id,
            merged,
            historical,
            forecast,
            growth,
            confidence,
            forecastSummary,
          };
        } catch (err) {
          console.warn(`Fallback untuk ${p.name}:`, err);
          // Fallback: gunakan simulated historical + linear forecast
          const currentScore = p.insightData?.health_score ?? 50;
          const months = 6;
          const hist: number[] = [];
          for (let i = months - 1; i >= 0; i--) {
            const variation = Math.floor(Math.random() * 6) - 3;
            hist.push(
              Math.max(0, Math.min(100, currentScore - i * 1.5 + variation)),
            );
          }
          const forecast = linearForecast(hist, 3);
          return {
            productId: p.id,
            merged: [], // tidak digunakan untuk fallback
            historical: hist,
            forecast,
            growth: 0,
            confidence: 0,
            forecastSummary: null,
          };
        }
      });
      const forecastResults = await Promise.all(forecastPromises);

      // 3. Siapkan label bulan (Jan, Feb, ...) – kita ambil dari merged data jika ada
      // Untuk fallback kita gunakan label standar
      const monthsLabels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
      ];
      const exportDate = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Makassar",
      });

      // ─── BUILD HTML ────────────────────────────────────────────
      const buildInsightHTML = (p: any) => {
        const insight = p.insightData;
        const score = insight?.health_score ?? 0;
        const sentiment = insight?.metrics?.positive_percentage ?? 0;
        const issue = insight?.dominant_issue ?? "Tidak ada";
        const risk = insight?.risk_level ?? "low";
        const riskLabel =
          risk === "low" ? "Rendah" : risk === "medium" ? "Sedang" : "Tinggi";

        let analysis = "";
        if (score >= 70) {
          analysis = `Produk ini memiliki Health Score yang tinggi (${score}/100) dan sentimen positif ${sentiment}%. Risiko ${riskLabel}. Pertahankan kualitas, ekspansi pasar dianjurkan.`;
        } else if (score >= 50) {
          analysis = `Skor ${score}/100, sentimen ${sentiment}%. Risiko ${riskLabel}. Isu dominan: ${issue}. Perbaikan pada aspek ${issue} dapat meningkatkan skor.`;
        } else {
          analysis = `Skor rendah (${score}/100), sentimen ${sentiment}%. Risiko ${riskLabel}. Isu dominan: ${issue}. Diperlukan intervensi segera pada ${issue} untuk mencegah penurunan lebih lanjut.`;
        }

        return `
          <div class="insight-box">
            <h4>${p.name}</h4>
            <p>${analysis}</p>
            <p style="font-size:13px; color:#64748b;">
              Rekomendasi: ${score < 50 ? "Segera perbaiki kemasan / kualitas produk." : score < 70 ? "Tingkatkan layanan atau fitur produk." : "Pertahankan dan tingkatkan distribusi."}
            </p>
          </div>
        `;
      };

      const buildForecastTable = (result: any) => {
        // Jika menggunakan merged data (hasil API), gunakan tanggal asli
        // Untuk fallback, gunakan bulan standar
        let rows = "";
        if (result.merged && result.merged.length > 0) {
          // Gunakan merged data (actual & predicted)
          const allData = result.merged;
          // Kita tampilkan maksimal 9 titik terakhir
          const displayData = allData.slice(-9);
          displayData.forEach((d: ForecastPoint) => {
            const date = d.date;
            const val = d.actual ?? d.predicted;
            const isPred = d.predicted !== null && d.predicted !== undefined;
            rows += `<tr><td>${date} ${isPred ? "(Prediksi)" : ""}</td><td>${val !== null && val !== undefined ? Math.round(val) : "-"}</td></tr>`;
          });
        } else {
          // Fallback: pakai bulan standar
          const hist = result.historical || [];
          const forecast = result.forecast || [];
          const allMonths = monthsLabels.slice(
            0,
            hist.length + forecast.length,
          );
          const allValues = [...hist, ...forecast];
          allMonths.forEach((month, i) => {
            const isForecast = i >= hist.length;
            const value =
              allValues[i] !== undefined ? Math.round(allValues[i]) : "-";
            rows += `<tr><td>${month} ${isForecast ? "(Prediksi)" : ""}</td><td>${value}</td></tr>`;
          });
        }
        return `<table style="width:auto;"><thead><tr><th>Periode</th><th>Skor Aktual / Prediksi</th></tr></thead><tbody>${rows}</tbody></table>`;
      };

      // ===== HTML UNTUK PDF (dengan grafik) =====
      let pdfHtml = `
        <html><head><style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background: #fff; }
          h1 { color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
          h2 { color: #0f172a; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px 12px; border: 1px solid #e2e8f0; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .badge-low { background: #dcfce7; color: #166534; }
          .badge-medium { background: #fef9c3; color: #854d0e; }
          .badge-high { background: #fee2e2; color: #991b1b; }
          .chart-container { margin: 20px 0; text-align: center; }
          .insight-box { background: #f8fafc; border-left: 4px solid #f59e0b; padding: 12px; margin: 10px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          .page-break { page-break-after: always; }
        </style></head><body>
        <h1>Laporan Perbandingan Multi-Produk</h1>
        <p style="color: #64748b;">Dicetak pada: ${exportDate} | Total Produk: ${productReports.length}</p>
        <h2>Ringkasan Performa</h2>
        <table>
          <thead><tr><th>No</th><th>Nama Produk</th><th>Health Score</th><th>Sentimen Positif</th><th>Isu Dominan</th><th>Risiko</th></tr></thead>
          <tbody>
      `;
      productReports.forEach((p, idx) => {
        const insight = p.insightData;
        const risk = insight?.risk_level || "low";
        const riskClass =
          risk === "low"
            ? "badge-low"
            : risk === "medium"
              ? "badge-medium"
              : "badge-high";
        const riskLabel =
          risk === "low" ? "Rendah" : risk === "medium" ? "Sedang" : "Tinggi";
        pdfHtml += `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${p.name}</strong></td>
            <td>${insight?.health_score ?? "-"} / 100</td>
            <td>${insight?.metrics?.positive_percentage ?? 0}%</td>
            <td>${insight?.dominant_issue ?? "-"}</td>
            <td><span class="badge ${riskClass}">${riskLabel}</span></td>
          </tr>
        `;
      });
      pdfHtml += `</tbody></table>`;

      // Grafik & Forecasting per produk
      pdfHtml += `<h2>Forecasting & Analisis Tren</h2>`;
      for (let i = 0; i < productReports.length; i++) {
        const p = productReports[i];
        const result = forecastResults[i];
        const growth = result?.growth ?? 0;
        const confidence = result?.confidence ?? 0;
        const color = i === 0 ? "#009B77" : "#F59E0B";

        // Siapkan data grafik dari merged (jika ada) atau fallback
        let labels: string[] = [];
        let data: number[] = [];
        if (result.merged && result.merged.length > 0) {
          // Gunakan merged data
          const merged = result.merged.slice(-9); // ambil 9 terakhir
          labels = merged.map((d: ForecastPoint) => d.date);
          data = merged.map((d: ForecastPoint) => d.actual ?? d.predicted ?? 0);
        } else {
          // Fallback: gunakan bulan standar
          const hist = result.historical || [];
          const forecast = result.forecast || [];
          const allMonths = monthsLabels.slice(
            0,
            hist.length + forecast.length,
          );
          const allValues = [...hist, ...forecast];
          labels = allMonths;
          data = allValues;
        }

        const chartImage = await generateChartImage(labels, [
          { label: p.name, data, color },
        ]);

        pdfHtml += `
          <div class="page-break" style="margin-top: 30px;">
            <h3>${p.name}</h3>
            <p><strong>Pertumbuhan (Growth):</strong> ${growth}% &nbsp;|&nbsp; <strong>Keyakinan (Confidence):</strong> ${confidence.toFixed(0)}%</p>
            <div class="chart-container">
              <img src="${chartImage}" alt="Grafik ${p.name}" style="max-width:100%; height:auto;" />
            </div>
            ${buildForecastTable(result)}
          </div>
        `;
      }

      // Insight per produk
      pdfHtml += `<h2>Insight Per Produk</h2>`;
      productReports.forEach((p) => {
        pdfHtml += buildInsightHTML(p);
      });

      pdfHtml += `
          <div class="footer">
            <p>Laporan dihasilkan oleh NusantaraInsight AI - Hybrid Rule Engine + Local LLM</p>
          </div>
        </body></html>
      `;

      // ===== HTML UNTUK WORD (tanpa gambar) =====
      let wordHtml = `
        <html><head><style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background: #fff; }
          h1 { color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
          h2 { color: #0f172a; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px 12px; border: 1px solid #e2e8f0; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .badge-low { background: #dcfce7; color: #166534; }
          .badge-medium { background: #fef9c3; color: #854d0e; }
          .badge-high { background: #fee2e2; color: #991b1b; }
          .insight-box { background: #f8fafc; border-left: 4px solid #f59e0b; padding: 12px; margin: 10px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style></head><body>
        <h1>Laporan Perbandingan Multi-Produk</h1>
        <p style="color: #64748b;">Dicetak pada: ${exportDate} | Total Produk: ${productReports.length}</p>
        <h2>Ringkasan Performa</h2>
        <table>
          <thead><tr><th>No</th><th>Nama Produk</th><th>Health Score</th><th>Sentimen Positif</th><th>Isu Dominan</th><th>Risiko</th></tr></thead>
          <tbody>
      `;
      productReports.forEach((p, idx) => {
        const insight = p.insightData;
        const risk = insight?.risk_level || "low";
        const riskClass =
          risk === "low"
            ? "badge-low"
            : risk === "medium"
              ? "badge-medium"
              : "badge-high";
        const riskLabel =
          risk === "low" ? "Rendah" : risk === "medium" ? "Sedang" : "Tinggi";
        wordHtml += `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${p.name}</strong></td>
            <td>${insight?.health_score ?? "-"} / 100</td>
            <td>${insight?.metrics?.positive_percentage ?? 0}%</td>
            <td>${insight?.dominant_issue ?? "-"}</td>
            <td><span class="badge ${riskClass}">${riskLabel}</span></td>
          </tr>
        `;
      });
      wordHtml += `</tbody></table>`;

      // Forecasting (tabel saja, tanpa gambar)
      wordHtml += `<h2>Forecasting & Analisis Tren</h2>`;
      for (let i = 0; i < productReports.length; i++) {
        const p = productReports[i];
        const result = forecastResults[i];
        const growth = result?.growth ?? 0;
        const confidence = result?.confidence ?? 0;
        wordHtml += `
          <div style="margin-top: 30px;">
            <h3>${p.name}</h3>
            <p><strong>Pertumbuhan (Growth):</strong> ${growth}% &nbsp;|&nbsp; <strong>Keyakinan (Confidence):</strong> ${confidence.toFixed(0)}%</p>
            <p><em>Grafik tidak dapat ditampilkan di Word. Silakan lihat versi PDF untuk grafik.</em></p>
            ${buildForecastTable(result)}
          </div>
        `;
      }

      // Insight
      wordHtml += `<h2>Insight Per Produk</h2>`;
      productReports.forEach((p) => {
        wordHtml += buildInsightHTML(p);
      });

      wordHtml += `
          <div class="footer">
            <p>Laporan dihasilkan oleh NusantaraInsight AI - Hybrid Rule Engine + Local LLM</p>
          </div>
        </body></html>
      `;

      // ─── EKSEKUSI EKSPOR ──────────────────────────────────────
      if (format === "pdf") {
        const html2pdf = (await import("html2pdf.js")).default;
        const element = document.createElement("div");
        element.innerHTML = pdfHtml;
        document.body.appendChild(element);
        await html2pdf()
          .set({
            margin: 10,
            filename: `Laporan_Multi_Produk.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          } as any) // atau as Html2PdfOptions & { pagebreak: any }
          .from(element)
          .save();
        document.body.removeChild(element);
      } else if (format === "word") {
        const blob = new Blob([wordHtml], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Laporan_Multi_Produk.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === "excel") {
        // ── EXCEL: 3 sheets ───────────────────────────────
        const wb = XLSX.utils.book_new();

        // Sheet 1: Ringkasan
        const summaryRows = [
          [
            "No",
            "Nama Produk",
            "Health Score",
            "Sentimen Positif",
            "Isu Dominan",
            "Risiko",
          ],
        ];
        productReports.forEach((p, idx) => {
          const insight = p.insightData;
          summaryRows.push([
            idx + 1,
            p.name,
            insight?.health_score ?? "-",
            `${insight?.metrics?.positive_percentage ?? 0}%`,
            insight?.dominant_issue ?? "-",
            insight?.risk_level ?? "low",
          ]);
        });
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

        // Sheet 2: Forecasting (dengan Growth & Confidence)
        const forecastRows = [
          [
            "Produk",
            "Periode",
            "Skor Aktual / Prediksi",
            "Growth",
            "Confidence",
          ],
        ];
        for (let i = 0; i < productReports.length; i++) {
          const result = forecastResults[i];
          const growth = result?.growth ?? 0;
          const confidence = result?.confidence ?? 0;
          let rows: any[][] = [];

          if (result.merged && result.merged.length > 0) {
            // Gunakan merged data
            const merged = result.merged.slice(-9);
            merged.forEach((d: ForecastPoint, idx: number) => {
              const isPred = d.predicted !== null && d.predicted !== undefined;
              const val = d.actual ?? d.predicted;
              // Growth & confidence hanya ditampilkan pada baris prediksi pertama
              const growthDisplay =
                isPred &&
                idx === merged.findIndex((m: any) => m.predicted !== null)
                  ? `${growth}%`
                  : "";
              const confDisplay =
                isPred &&
                idx === merged.findIndex((m: any) => m.predicted !== null)
                  ? `${confidence.toFixed(0)}%`
                  : "";
              rows.push([
                productReports[i].name,
                `${d.date}${isPred ? " (Prediksi)" : ""}`,
                val !== null && val !== undefined ? Math.round(val) : "-",
                growthDisplay,
                confDisplay,
              ]);
            });
          } else {
            // Fallback: bulan standar
            const hist = result.historical || [];
            const forecast = result.forecast || [];
            const allMonths = monthsLabels.slice(
              0,
              hist.length + forecast.length,
            );
            const allValues = [...hist, ...forecast];
            allMonths.forEach((month, idx) => {
              const isForecast = idx >= hist.length;
              const value =
                allValues[idx] !== undefined ? Math.round(allValues[idx]) : "-";
              // Growth & confidence hanya pada baris prediksi pertama
              const growthDisplay =
                isForecast && idx === hist.length ? `${growth}%` : "";
              const confDisplay =
                isForecast && idx === hist.length
                  ? `${confidence.toFixed(0)}%`
                  : "";
              rows.push([
                productReports[i].name,
                `${month}${isForecast ? " (Prediksi)" : ""}`,
                value,
                growthDisplay,
                confDisplay,
              ]);
            });
          }

          forecastRows.push(...rows);
          forecastRows.push([]); // pemisah antar produk
        }
        const wsForecast = XLSX.utils.aoa_to_sheet(forecastRows);
        XLSX.utils.book_append_sheet(wb, wsForecast, "Forecasting");

        // Sheet 3: Insight
        const insightRows = [["Produk", "Insight", "Rekomendasi"]];
        productReports.forEach((p) => {
          const insight = p.insightData;
          const score = insight?.health_score ?? 0;
          const sentiment = insight?.metrics?.positive_percentage ?? 0;
          const issue = insight?.dominant_issue ?? "Tidak ada";
          const risk = insight?.risk_level ?? "low";
          const riskLabel =
            risk === "low" ? "Rendah" : risk === "medium" ? "Sedang" : "Tinggi";

          let analysis = "";
          if (score >= 70) {
            analysis = `Health Score tinggi (${score}/100), sentimen ${sentiment}%, risiko ${riskLabel}. Pertahankan kualitas, ekspansi pasar dianjurkan.`;
          } else if (score >= 50) {
            analysis = `Skor ${score}/100, sentimen ${sentiment}%, risiko ${riskLabel}. Isu dominan: ${issue}. Perbaikan pada aspek ${issue} dapat meningkatkan skor.`;
          } else {
            analysis = `Skor rendah (${score}/100), sentimen ${sentiment}%, risiko ${riskLabel}. Isu dominan: ${issue}. Diperlukan intervensi segera pada ${issue}.`;
          }

          let rekomendasi = "";
          if (score < 50)
            rekomendasi = "Segera perbaiki kemasan / kualitas produk.";
          else if (score < 70)
            rekomendasi = "Tingkatkan layanan atau fitur produk.";
          else rekomendasi = "Pertahankan dan tingkatkan distribusi.";

          insightRows.push([p.name, analysis, rekomendasi]);
        });
        const wsInsight = XLSX.utils.aoa_to_sheet(insightRows);
        XLSX.utils.book_append_sheet(wb, wsInsight, "Insight");

        // Simpan Excel
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Laporan_Multi_Produk.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Gagal mengekspor:", error);
      alert("Terjadi kesalahan saat mengambil data produk. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  // ─── UI ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6 bg-background text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition mb-3"
          >
            <ArrowLeft size={14} />
            Kembali ke Dashboard
          </Link>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
            Report Builder
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Ekspor Laporan Multi-Produk
          </h1>
          <p className="text-sm text-muted mt-2 max-w-lg">
            Pilih beberapa produk untuk membuat laporan perbandingan performa,
            sentimen, dan risiko.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative group">
            <button
              disabled={exporting || selectedIds.size === 0}
              className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-foreground text-sm font-medium transition-colors ${
                exporting || selectedIds.size === 0
                  ? "bg-card text-muted cursor-not-allowed opacity-50"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {exporting ? "Menyiapkan..." : `Ekspor (${selectedIds.size})`}
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 glass-card border border-border p-1 rounded-lg hidden group-hover:block z-20">
              <button
                onClick={() => handleExport("pdf")}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-card rounded flex items-center gap-2 transition-colors"
              >
                <FileOutput size={14} /> PDF
              </button>
              <button
                onClick={() => handleExport("word")}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-card rounded flex items-center gap-2 transition-colors"
              >
                <FileText size={14} /> Word
              </button>
              <button
                onClick={() => handleExport("excel")}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-card rounded flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Tabel produk */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/50 p-3 rounded-xl border border-border">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>
            Dipilih:{" "}
            <strong className="text-foreground">{selectedIds.size}</strong>{" "}
            produk
          </span>
          <button
            onClick={toggleSelectAll}
            className="text-primary hover:text-primary/80 transition underline"
          >
            {selectedIds.size === filteredProducts.length
              ? "Hapus semua"
              : "Pilih semua"}
          </button>
        </div>
        <label className="flex items-center gap-2 h-9 w-full sm:w-64 rounded-lg bg-card border border-border px-3 focus-within:border-primary">
          <Search size={14} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            placeholder="Cari produk..."
          />
        </label>
      </div>

      <div className="glass-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-card/50 text-xs font-bold uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input type="checkbox" className="accent-primary" />
                </th>
                <th className="px-4 py-3">Nama Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-center">Health Score</th>
                <th className="px-4 py-3 text-center">Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Memuat produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const insight = p.insights?.[0];
                  const risk = insight?.riskLevel || "low";
                  const riskColor =
                    risk === "low"
                      ? "text-secondary"
                      : risk === "medium"
                        ? "text-primary"
                        : "text-danger";
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-card/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="accent-primary w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {p.category ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-foreground">
                        {insight?.healthScore ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium ${riskColor}`}>
                          {risk === "low"
                            ? "Rendah"
                            : risk === "medium"
                              ? "Sedang"
                              : "Tinggi"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-xs text-muted">
        Pastikan produk yang dipilih sudah memiliki data insight (Generate
        Insight terlebih dahulu di Dashboard).
      </div>
    </div>
  );
}
