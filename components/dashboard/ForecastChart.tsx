"use client";

import { Info } from "lucide-react";
import ForecastChartSkeleton from "@/components/dashboard/skeleton/ForecastChartSkeleton";

type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
  upper?: number | null;
  lower?: number | null;
};

type ConfidenceContext = {
  label: string;
  message: string;
  color: "green" | "amber" | "red";
};

type ForecastSummary = {
  avg: number;
  min: number;
  max: number;
  lower: number;
  upper: number;
};

function getDemandAlert(growth: number): {
  text: string;
  color: string;
  bg: string;
} {
  if (growth > 20)
    return {
      text: "Permintaan diprediksi meningkat signifikan",
      color: "#009B77",
      bg: "bg-[#009B77]/20",
    };
  if (growth > 5)
    return {
      text: "Pertumbuhan permintaan moderat",
      color: "#009B77",
      bg: "bg-[#009B77]/20",
    };
  if (growth < -10)
    return {
      text: "Permintaan diprediksi menurun",
      color: "#E24B4A",
      bg: "bg-[#E24B4A]/20",
    };
  return {
    text: "Permintaan diprediksi stabil",
    color: "#7F77DD",
    bg: "bg-[#7F77DD]/20",
  };
}

function IntervalBar({
  lower,
  upper,
  avg,
}: {
  lower: number;
  upper: number;
  avg: number;
}) {
  const range = upper - lower;
  const pct = range > 0 ? ((avg - lower) / range) * 100 : 50;
  const clamped = Math.max(0, Math.min(100, pct));

  return (
    <div className="mt-3">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-slate-500">
          Min {lower.toLocaleString("id-ID")}
        </span>
        <span className="text-[10px] text-slate-500">
          Maks {upper.toLocaleString("id-ID")}
        </span>
      </div>

      <div className="relative h-1.5 rounded-full bg-[#1e293b] overflow-visible">
        <div className="absolute inset-0 rounded-full bg-linear-to-r from-[#009B77]/30 via-[#009B77]/60 to-[#009B77]/30" />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#009B77] border-2 border-background shadow-[0_0_8px_rgba(0,155,119,0.6)]"
          style={{ left: `${clamped}%` }}
        />
      </div>

      <p className="text-[10px] text-slate-500 text-center mt-1.5">
        Rentang prediksi 80% (uncertainty interval Prophet)
      </p>
    </div>
  );
}

export default function ForecastChart({
  data,
  growth,
  confidence,
  confidenceContext,
  modelUsed,
  forecastSummary,
  freq = "D",
  loading,
}: {
  data: ForecastPoint[];
  growth: number;
  confidence: number;
  confidenceContext?: ConfidenceContext | null;
  modelUsed?: string;
  forecastSummary?: ForecastSummary | null;
  freq?: "D" | "W";
  loading: boolean;
}) {
  if (loading) return <ForecastChartSkeleton />;
  if (!data || data.length === 0) return null;

  const latestActual = [...data].reverse().find((d) => d.actual)?.actual;
  const avgPredicted =
    forecastSummary?.avg ??
    (() => {
      const vals = data.filter((d) => d.predicted).map((d) => d.predicted ?? 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    })();

  const hasInterval =
    forecastSummary &&
    forecastSummary.lower !== undefined &&
    forecastSummary.upper !== undefined &&
    forecastSummary.upper > forecastSummary.lower;

  const alert = getDemandAlert(growth);
  const unitLabel = freq === "W" ? "minggu" : "hari";
  const period = freq === "W" ? 4 : 7;

  const ctxMessage = confidenceContext?.message ?? "";

  const shouldShowAbsUnit = (latestActual ?? 0) < 10 || avgPredicted < 10;
  let growthDisplay = "";
  let growthColor = "#7F77DD";

  if (shouldShowAbsUnit) {
    const unitDifference = Math.round(avgPredicted - (latestActual ?? 0));
    if (unitDifference > 0) {
      growthDisplay = `+${unitDifference} unit`;
      growthColor = "#009B77";
    } else if (unitDifference < 0) {
      growthDisplay = `${unitDifference} unit`;
      growthColor = "#E24B4A";
    } else {
      growthDisplay = `0 unit`;
      growthColor = "#7F77DD";
    }
  } else {
    if (growth > 0) {
      growthDisplay = `+${growth}%`;
      growthColor = "#009B77";
    } else if (growth < 0) {
      growthDisplay = `${growth}%`;
      growthColor = "#E24B4A";
    } else {
      growthDisplay = `0%`;
      growthColor = "#7F77DD";
    }
  }

  if (modelUsed === "moving_average") {
    return (
      <div className="glass-card-lg p-5 sm:p-6 lg:p-7 min-h-[420px] flex flex-col justify-between text-white border border-border">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-sm font-bold text-white">
                Estimasi Permintaan (Data Terbatas)
              </p>
              <Info size={14} className="text-slate-500" />
              <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 pointer-events-none">
                <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
                  Metode estimasi jangka pendek yang digunakan otomatis karena
                  data riwayat transaksi penjualan Anda belum mencukupi untuk
                  pemodelan AI tingkat lanjut.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Karena data penjualan sangat minim, sistem menggunakan metode
              rata-rata tertimbang dari 3 data terakhir.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Rata-rata Prediksi
              </p>
              <Info size={11} className="text-slate-500" />
              <div className="absolute left-0 top-full mt-1 w-60 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                  Nilai rata-rata volume penjualan yang diekspektasikan muncul
                  di setiap periode ke depan berdasarkan tren jangka pendek.
                </p>
              </div>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-[#009B77] flex items-baseline gap-2">
              {avgPredicted
                ? Math.round(avgPredicted).toLocaleString("id-ID")
                : "—"}
              <span className="text-base text-slate-500 font-normal">
                unit/{unitLabel}
              </span>
            </p>
          </div>

          {hasInterval && forecastSummary && (
            <div className="bg-[#1e293b]/60 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-1.5 group cursor-help w-fit mb-2 relative">
                <p className="text-[10px] text-slate-500">Rentang Estimasi</p>
                <Info size={11} className="text-slate-500" />
                <div className="absolute left-0 top-full mt-1 w-60 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                  <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                    Batas minimum dan maksimum toleransi deviasi statis
                    menggunakan metode deviasi standar MVA sederhana.
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-white">
                <span>
                  {Math.round(forecastSummary.lower).toLocaleString("id-ID")}
                </span>
                <span className="text-slate-500">—</span>
                <span>
                  {Math.round(forecastSummary.upper).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="h-1 bg-[#009B77]/30 rounded-full mt-2">
                <div className="h-full w-full rounded-full bg-[#009B77]" />
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2">
                Rentang estimasi 80% (MVA sederhana)
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1e293b]/60 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Penjualan Terakhir
                </p>
                <Info size={11} className="text-slate-500" />
                <div className="absolute left-0 top-full mt-1 w-52 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                  <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                    Volume transaksi riil terakhir yang berhasil disinkronisasi
                    oleh sistem sebelum proyeksi dimulai.
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {latestActual ? latestActual.toLocaleString("id-ID") : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">unit terjual</p>
            </div>
            <div className="bg-[#1e293b]/60 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Rata-rata Prediksi
                </p>
                <Info size={11} className="text-slate-500" />
                <div className="absolute right-0 top-full mt-1 w-52 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                  <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                    Representasi target permintaan tengah per interval waktu (
                    {unitLabel}).
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {avgPredicted
                  ? Math.round(avgPredicted).toLocaleString("id-ID")
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                unit/{unitLabel}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-6 leading-relaxed">
          Estimasi menggunakan rata-rata tertimbang (Moving Average) dari data
          penjualan terakhir karena data historis masih sangat terbatas.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-lg p-5 sm:p-6 lg:p-7 min-h-[420px] flex flex-col justify-between text-white border border-border">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
            <p className="text-sm font-bold text-white">Prediksi Permintaan</p>
            <Info size={14} className="text-slate-500" />
            <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
              <p className="text-[11px] text-slate-300 font-normal normal-case tracking-normal leading-relaxed">
                Analisis perkiraan volume penjualan ke depan menggunakan model
                kecerdasan buatan (*time-series*) guna mendeteksi pola musiman
                dan siklus penjualan produk.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Berdasarkan tren penjualan historis
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Prediksi Pertumbuhan
            </p>
            <Info size={11} className="text-slate-500" />
            <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
              <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                Persentase kenaikan atau penurunan yang dihitung dengan
                membandingkan titik data aktual terakhir dengan rata-rata hasil
                ramalan AI.
              </p>
            </div>
          </div>
          <p
            className="text-4xl sm:text-5xl font-bold"
            style={{ color: growthColor, lineHeight: 1 }}
          >
            {growthDisplay}
          </p>
          <div
            className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${alert.bg}`}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: alert.color }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: alert.color }}
            >
              {alert.text}
            </span>
          </div>
        </div>

        {/* METRIK ACCURACY / CONFIDENCE DENGAN PENJELASAN MENDALAM */}
        <div className="bg-[#1e293b]/60 rounded-xl p-4 border border-border">
          <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
            <p className="text-[10px] text-slate-500">
              Tingkat Kepercayaan Model
            </p>
            <Info size={11} className="text-slate-500" />
            <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 pointer-events-none">
              <p className="text-[11px] text-slate-200 font-semibold mb-1">
                Bagaimana skor ini dihitung?
              </p>
              <p className="text-[10px] text-slate-400 font-normal normal-case tracking-normal leading-relaxed mb-2">
                Persentase ini dihitung secara matematis berdasarkan{" "}
                <span className="text-amber-400 font-medium">
                  "volume kecukupan data historis"
                </span>
                ,{" "}
                <span className="text-amber-400 font-medium">
                  "keteraturan pola musiman"
                </span>
                , dan{" "}
                <span className="text-amber-400 font-medium">
                  "tingkat fluktuasi acak (noise)"
                </span>{" "}
                pada transaksi produk Anda.
              </p>
              <p className="text-[10px] text-slate-400 font-normal normal-case tracking-normal leading-relaxed border-t border-border/60 pt-1.5">
                <strong className="text-amber-400 font-medium">Catatan:</strong>{" "}
                Jika persentase ini rendah, hal tersebut{" "}
                <span className="text-white font-medium">
                  BUKAN berarti model rusak/salah
                </span>
                , melainkan karena data riwayat penjualan Anda terlalu minim,
                polanya acak, atau kurang informatif bagi AI untuk menemukan
                tren yang stabil.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {confidence.toFixed(1)}%
            </span>
            {confidence >= 70 ? (
              <span className="text-xs font-semibold text-[#009B77]">
                Akurasi Tinggi
              </span>
            ) : confidence >= 40 ? (
              <span className="text-xs font-semibold text-[#F59E0B]">
                Akurasi Sedang
              </span>
            ) : confidence >= 20 ? (
              <span className="text-xs font-semibold text-[#E24B4A]">
                Akurasi Rendah
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded">
                Data Terbatas
              </span>
            )}
          </div>

          {ctxMessage && (
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              {ctxMessage}
            </p>
          )}

          {modelUsed && (
            <p className="text-[10px] text-slate-500 mt-2">
              Model: {modelUsed.replace(/_/g, " ")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1e293b]/60 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Penjualan Terakhir
              </p>
              <Info size={11} className="text-slate-500" />
              <div className="absolute left-0 top-full mt-1 w-52 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                  Volume transaksi riil terakhir yang berhasil terekam sistem
                  sebelum masuk ke masa proyeksi depan.
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {latestActual ? latestActual.toLocaleString("id-ID") : "—"}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">unit terjual</p>
          </div>
          <div className="bg-[#1e293b]/60 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Rata-rata Prediksi
              </p>
              <Info size={11} className="text-slate-500" />
              <div className="absolute right-0 top-full mt-1 w-52 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                  Target volume rata-rata yang diekspektasikan muncul di masa
                  mendatang berdasarkan kalkulasi AI.
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {avgPredicted
                ? Math.round(avgPredicted).toLocaleString("id-ID")
                : "—"}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">unit/{unitLabel}</p>
          </div>
        </div>

        {hasInterval && forecastSummary && (
          <div className="bg-[#009B77]/10 rounded-xl p-4 border border-[#009B77]/20">
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-[10px] text-slate-400">
                Rentang Prediksi {period} {unitLabel}
              </p>
              <Info size={11} className="text-slate-400" />
              <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                  Batas atas & batas bawah probabilistik (Uncertainty Interval).
                  Menunjukkan area di mana data riil di lapangan kemungkinan
                  besar akan jatuh (probabilitas 80%).
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-[#009B77]">
                {Math.round(forecastSummary.lower).toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] text-slate-500">—</span>
              <span className="text-sm font-semibold text-[#009B77]">
                {Math.round(forecastSummary.upper).toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">
                unit/{unitLabel}
              </span>
            </div>
            <IntervalBar
              lower={forecastSummary.lower}
              upper={forecastSummary.upper}
              avg={forecastSummary.avg}
            />
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500 mt-6 leading-relaxed">
        Prediksi menggunakan{" "}
        {modelUsed
          ? modelUsed.replace(/_/g, " ") === "moving average"
            ? "rata-rata tertimbang (Moving Average)"
            : modelUsed.replace(/_/g, " ")
          : "Prophet"}{" "}
        berdasarkan data historis penjualan produk ini
      </p>
    </div>
  );
}
