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
  className: string;
} {
  if (growth > 20)
    return {
      text: "Permintaan diprediksi meningkat signifikan",
      className: "bg-secondary/20 text-secondary",
    };
  if (growth > 5)
    return {
      text: "Pertumbuhan permintaan moderat",
      className: "bg-secondary/20 text-secondary",
    };
  if (growth < -10)
    return {
      text: "Permintaan diprediksi menurun",
      className: "bg-danger/20 text-danger",
    };
  return {
    text: "Permintaan diprediksi stabil",
    className: "bg-tertiary/20 text-tertiary",
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
        <span className="text-[10px] text-muted">
          Min {lower.toLocaleString("id-ID")}
        </span>
        <span className="text-[10px] text-muted">
          Maks {upper.toLocaleString("id-ID")}
        </span>
      </div>

      <div className="relative h-1.5 rounded-full bg-card overflow-visible">
        <div className="absolute inset-0 rounded-full bg-linear-to-r from-secondary/30 via-secondary/60 to-secondary/30" />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-secondary border-2 border-background shadow-[0_0_8px_rgba(0,155,119,0.6)]"
          style={{ left: `${clamped}%` }}
        />
      </div>

      <p className="text-[10px] text-muted text-center mt-1.5">
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
  let growthColor = "var(--color-tertiary)";

  if (shouldShowAbsUnit) {
    const unitDifference = Math.round(avgPredicted - (latestActual ?? 0));
    if (unitDifference > 0) {
      growthDisplay = `+${unitDifference} unit`;
      growthColor = "var(--color-secondary)";
    } else if (unitDifference < 0) {
      growthDisplay = `${unitDifference} unit`;
      growthColor = "var(--color-danger)";
    } else {
      growthDisplay = `0 unit`;
      growthColor = "var(--color-tertiary)";
    }
  } else {
    if (growth > 0) {
      growthDisplay = `+${growth}%`;
      growthColor = "var(--color-secondary)";
    } else if (growth < 0) {
      growthDisplay = `${growth}%`;
      growthColor = "var(--color-danger)";
    } else {
      growthDisplay = `0%`;
      growthColor = "var(--color-tertiary)";
    }
  }

  if (modelUsed === "moving_average") {
    return (
      <div className="glass-card-lg p-5 sm:p-6 lg:p-7 min-h-[420px] flex flex-col justify-between border border-border">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-sm font-bold text-foreground">
                Estimasi Permintaan (Data Terbatas)
              </p>
              <Info size={14} className="text-muted" />
              <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 pointer-events-none">
                <p className="text-[11px] text-muted font-normal normal-case tracking-normal leading-relaxed">
                  Metode estimasi jangka pendek yang digunakan otomatis karena
                  data riwayat transaksi penjualan Anda belum mencukupi untuk
                  pemodelan AI tingkat lanjut.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted mt-1">
              Karena data penjualan sangat minim, sistem menggunakan metode
              rata-rata tertimbang dari 3 data terakhir.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Rata-rata Prediksi
              </p>
              <Info size={11} className="text-muted" />
              <div className="absolute left-0 top-full mt-1 w-60 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-muted font-normal leading-relaxed">
                  Nilai rata-rata volume penjualan yang diekspektasikan muncul
                  di setiap periode ke depan berdasarkan tren jangka pendek.
                </p>
              </div>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-secondary flex items-baseline gap-2">
              {avgPredicted
                ? Math.round(avgPredicted).toLocaleString("id-ID")
                : "—"}
              <span className="text-base text-muted font-normal">
                unit/{unitLabel}
              </span>
            </p>
          </div>

          {hasInterval && forecastSummary && (
            <div className="bg-card/60 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-1.5 group cursor-help w-fit mb-2 relative">
                <p className="text-[10px] text-muted">Rentang Estimasi</p>
                <Info size={11} className="text-muted" />
                <div className="absolute left-0 top-full mt-1 w-60 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                  <p className="text-[11px] text-muted font-normal leading-relaxed">
                    Batas minimum dan maksimum toleransi deviasi statis
                    menggunakan metode deviasi standar MVA sederhana.
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-foreground">
                <span>
                  {Math.round(forecastSummary.lower).toLocaleString("id-ID")}
                </span>
                <span className="text-muted">—</span>
                <span>
                  {Math.round(forecastSummary.upper).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="h-1 bg-secondary/30 rounded-full mt-2">
                <div className="h-full w-full rounded-full bg-secondary" />
              </div>
              <p className="text-[10px] text-muted text-center mt-2">
                Rentang estimasi 80% (MVA sederhana)
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card/60 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Penjualan Terakhir
                </p>
                <Info size={11} className="text-muted" />
                <div className="absolute left-0 top-full mt-1 w-52 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                  <p className="text-[11px] text-muted font-normal leading-relaxed">
                    Volume transaksi riil terakhir yang berhasil disinkronisasi
                    oleh sistem sebelum proyeksi dimulai.
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {latestActual ? latestActual.toLocaleString("id-ID") : "—"}
              </p>
              <p className="text-[10px] text-muted mt-1">unit terjual</p>
            </div>
            <div className="bg-card/60 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Rata-rata Prediksi
                </p>
                <Info size={11} className="text-muted" />
                <div className="absolute right-0 top-full mt-1 w-52 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                  <p className="text-[11px] text-muted font-normal leading-relaxed">
                    Representasi target permintaan tengah per interval waktu (
                    {unitLabel}).
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {avgPredicted
                  ? Math.round(avgPredicted).toLocaleString("id-ID")
                  : "—"}
              </p>
              <p className="text-[10px] text-muted mt-1">unit/{unitLabel}</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted mt-6 leading-relaxed">
          Estimasi menggunakan rata-rata tertimbang (Moving Average) dari data
          penjualan terakhir karena data historis masih sangat terbatas.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-lg p-5 sm:p-6 lg:p-7 min-h-[420px] flex flex-col justify-between border border-border">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
            <p className="text-sm font-bold text-foreground">
              Prediksi Permintaan
            </p>
            <Info size={14} className="text-muted" />
            <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
              <p className="text-[11px] text-muted font-normal normal-case tracking-normal leading-relaxed">
                Analisis perkiraan volume penjualan ke depan menggunakan model
                kecerdasan buatan (*time-series*) guna mendeteksi pola musiman
                dan siklus penjualan produk.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted mt-1">
            Berdasarkan tren penjualan historis
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Prediksi Pertumbuhan
            </p>
            <Info size={11} className="text-muted" />
            <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
              <p className="text-[11px] text-muted font-normal leading-relaxed">
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
            className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${alert.className}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <span className="text-xs font-semibold">{alert.text}</span>
          </div>
        </div>

        {/* METRIK ACCURACY / CONFIDENCE DENGAN PENJELASAN MENDALAM */}
        <div className="bg-card/60 rounded-xl p-4 border border-border">
          <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
            <p className="text-[10px] text-muted">Tingkat Kepercayaan Model</p>
            <Info size={11} className="text-muted" />
            <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 pointer-events-none">
              <p className="text-[11px] text-foreground font-semibold mb-1">
                Bagaimana skor ini dihitung?
              </p>
              <p className="text-[10px] text-muted font-normal normal-case tracking-normal leading-relaxed mb-2">
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
              <p className="text-[10px] text-muted font-normal normal-case tracking-normal leading-relaxed border-t border-border/60 pt-1.5">
                <strong className="text-amber-400 font-medium">Catatan:</strong>{" "}
                Jika persentase ini rendah, hal tersebut{" "}
                <span className="text-foreground font-medium">
                  BUKAN berarti model rusak/salah
                </span>
                , melainkan karena data riwayat penjualan Anda terlalu minim,
                polanya acak, atau kurang informatif bagi AI untuk menemukan
                tren yang stabil.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold text-foreground">
              {confidence.toFixed(1)}%
            </span>
            {confidence >= 70 ? (
              <span className="text-xs font-semibold text-secondary">
                Akurasi Tinggi
              </span>
            ) : confidence >= 40 ? (
              <span className="text-xs font-semibold text-primary">
                Akurasi Sedang
              </span>
            ) : confidence >= 20 ? (
              <span className="text-xs font-semibold text-danger">
                Akurasi Rendah
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted border border-muted/30 px-2 py-0.5 rounded">
                Data Terbatas
              </span>
            )}
          </div>

          {ctxMessage && (
            <p className="text-[10px] text-muted mt-2 leading-relaxed">
              {ctxMessage}
            </p>
          )}

          {modelUsed && (
            <p className="text-[10px] text-muted mt-2">
              Model: {modelUsed.replace(/_/g, " ")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/60 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Penjualan Terakhir
              </p>
              <Info size={11} className="text-muted" />
              <div className="absolute left-0 top-full mt-1 w-52 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-muted font-normal leading-relaxed">
                  Volume transaksi riil terakhir yang berhasil terekam sistem
                  sebelum masuk ke masa proyeksi depan.
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {latestActual ? latestActual.toLocaleString("id-ID") : "—"}
            </p>
            <p className="text-[10px] text-muted mt-1">unit terjual</p>
          </div>
          <div className="bg-card/60 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Rata-rata Prediksi
              </p>
              <Info size={11} className="text-muted" />
              <div className="absolute right-0 top-full mt-1 w-52 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-muted font-normal leading-relaxed">
                  Target volume rata-rata yang diekspektasikan muncul di masa
                  mendatang berdasarkan kalkulasi AI.
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {avgPredicted
                ? Math.round(avgPredicted).toLocaleString("id-ID")
                : "—"}
            </p>
            <p className="text-[10px] text-muted mt-1">unit/{unitLabel}</p>
          </div>
        </div>

        {hasInterval && forecastSummary && (
          <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
            <div className="flex items-center gap-1.5 group cursor-help w-fit mb-1 relative">
              <p className="text-[10px] text-muted">
                Rentang Prediksi {period} {unitLabel}
              </p>
              <Info size={11} className="text-muted" />
              <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                <p className="text-[11px] text-muted font-normal leading-relaxed">
                  Batas atas & batas bawah probabilistik (Uncertainty Interval).
                  Menunjukkan area di mana data riil di lapangan kemungkinan
                  besar akan jatuh (probabilitas 80%).
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-secondary">
                {Math.round(forecastSummary.lower).toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] text-muted">—</span>
              <span className="text-sm font-semibold text-secondary">
                {Math.round(forecastSummary.upper).toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] text-muted ml-1">
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

      <p className="text-[10px] text-muted mt-6 leading-relaxed">
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
