"use client";

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
      color: "#5DCAA5",
      bg: "rgba(29,158,117,0.2)",
    };
  if (growth > 5)
    return {
      text: "Pertumbuhan permintaan moderat",
      color: "#5DCAA5",
      bg: "rgba(29,158,117,0.2)",
    };
  if (growth < -10)
    return {
      text: "Permintaan diprediksi menurun",
      color: "#E24B4A",
      bg: "rgba(226,75,74,0.2)",
    };
  return {
    text: "Permintaan diprediksi stabil",
    color: "#AFA9EC",
    bg: "rgba(127,119,221,0.2)",
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
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
          Min {lower.toLocaleString("id-ID")}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
          Maks {upper.toLocaleString("id-ID")}
        </span>
      </div>

      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 99,
          background: "rgba(255,255,255,0.12)",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "100%",
            borderRadius: 99,
            background:
              "linear-gradient(90deg, rgba(93,202,165,0.25) 0%, rgba(93,202,165,0.55) 50%, rgba(93,202,165,0.25) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${clamped}%`,
            transform: "translate(-50%, -50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#5DCAA5",
            border: "2px solid #1a1a2e",
            boxShadow: "0 0 6px rgba(93,202,165,0.7)",
          }}
        />
      </div>

      <p
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          marginTop: 5,
          textAlign: "center",
        }}
      >
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
  loading,
}: {
  data: ForecastPoint[];
  growth: number;
  confidence: number;
  confidenceContext?: ConfidenceContext | null;
  modelUsed?: string;
  forecastSummary?: ForecastSummary | null;
  loading: boolean;
}) {
  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return <ForecastChartSkeleton />;
  }

  // ── EMPTY — null ATAU array kosong dianggap kondisi yang sama,
  // sembunyikan komponen sepenuhnya ──────────────────────────────────────
  if (!data || data.length === 0) {
    return null;
  }

  // ── DATA ADA — render normal ────────────────────────────────────────────
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
  const growthDisplay = growth > 0 ? `+${growth}%` : `${growth}%`;
  const growthColor =
    growth > 0 ? "#5DCAA5" : growth < 0 ? "#E24B4A" : "#AFA9EC";

  const ctxColor =
    confidenceContext?.color === "green"
      ? "#5DCAA5"
      : confidenceContext?.color === "amber"
        ? "#EF9F27"
        : "#E24B4A";

  const ctxLabel =
    confidenceContext?.label ??
    (confidence >= 70
      ? "Akurasi Tinggi"
      : confidence >= 40
        ? "Akurasi Sedang"
        : "Akurasi Rendah");

  const ctxMessage = confidenceContext?.message ?? "";

  return (
    <div
      className="min-w-0 p-5 sm:p-6 lg:p-7"
      style={{
        minHeight: 420,
        borderRadius: 20,
        background: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#fff",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>
            Prediksi Permintaan
          </p>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              marginTop: 4,
            }}
          >
            Berdasarkan tren penjualan historis
          </p>
        </div>

        <div>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Prediksi Pertumbuhan
          </p>
          <p
            className="text-[36px] sm:text-[44px]"
            style={{ fontWeight: 500, color: growthColor, lineHeight: 1 }}
          >
            {growthDisplay}
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              padding: "4px 10px",
              borderRadius: 20,
              background: alert.bg,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: alert.color,
              }}
            />
            <span style={{ fontSize: 11, color: alert.color, fontWeight: 500 }}>
              {alert.text}
            </span>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 4,
            }}
          >
            Tingkat Kepercayaan Model
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: "#fff" }}>
              {confidence.toFixed(1)}%
            </span>
            <span style={{ fontSize: 11, color: ctxColor, fontWeight: 500 }}>
              {ctxLabel}
            </span>
          </div>
          {ctxMessage && (
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              {ctxMessage}
            </p>
          )}
          {modelUsed && (
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                marginTop: 6,
              }}
            >
              Model: {modelUsed.replace(/_/g, " ")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-[10px]">
          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Penjualan Terakhir
            </p>
            <p style={{ fontSize: 22, fontWeight: 500, color: "#fff" }}>
              {latestActual ? latestActual.toLocaleString("id-ID") : "—"}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.35)",
                marginTop: 2,
              }}
            >
              unit terjual
            </p>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Rata-rata Prediksi
            </p>
            <p style={{ fontSize: 22, fontWeight: 500, color: "#fff" }}>
              {avgPredicted
                ? Math.round(avgPredicted).toLocaleString("id-ID")
                : "—"}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.35)",
                marginTop: 2,
              }}
            >
              unit/hari
            </p>
          </div>
        </div>

        {hasInterval && forecastSummary && (
          <div
            style={{
              background: "rgba(93,202,165,0.07)",
              border: "1px solid rgba(93,202,165,0.18)",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 2,
              }}
            >
              Rentang Prediksi 7 Hari
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: "#5DCAA5" }}>
                {Math.round(forecastSummary.lower).toLocaleString("id-ID")}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                —
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#5DCAA5" }}>
                {Math.round(forecastSummary.upper).toLocaleString("id-ID")}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                  marginLeft: 2,
                }}
              >
                unit/hari
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

      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          marginTop: 16,
          lineHeight: 1.5,
        }}
      >
        Prediksi menggunakan{" "}
        {modelUsed ? modelUsed.replace(/_/g, " ") : "Prophet"} berdasarkan data
        historis penjualan produk ini
      </p>
    </div>
  );
}
