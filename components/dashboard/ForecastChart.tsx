"use client";

type ForecastPoint = {
  date: string;
  actual?: number | null;
  predicted?: number | null;
  confidence?: number;
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

function getAccuracyLabel(confidence: number): { text: string; color: string } {
  if (confidence >= 80) return { text: "Akurasi Tinggi", color: "#5DCAA5" };
  if (confidence >= 60) return { text: "Akurasi Sedang", color: "#EF9F27" };
  return { text: "Akurasi Rendah", color: "#E24B4A" };
}

export default function ForecastChart({
  data,
  growth,
  confidence,
}: {
  data: ForecastPoint[];
  growth: number;
  confidence: number;
}) {
  const latestActual = [...data].reverse().find((d) => d.actual)?.actual;

  const predictedValues = data
    .filter((d) => d.predicted)
    .map((d) => d.predicted ?? 0);
  const avgPredicted = predictedValues.length
    ? predictedValues.reduce((a, b) => a + b, 0) / predictedValues.length
    : 0;

  const alert = getDemandAlert(growth);
  const accuracy = getAccuracyLabel(confidence);

  const growthDisplay = growth > 0 ? `+${growth}%` : `${growth}%`;
  const growthColor =
    growth > 0 ? "#5DCAA5" : growth < 0 ? "#E24B4A" : "#AFA9EC";

  return (
    <div
      style={{
        minHeight: 420,
        borderRadius: 20,
        background: "#1a1a2e",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#fff",
      }}
    >
      {/* TOP SECTION */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Title */}
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

        {/* Growth */}
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
            style={{
              fontSize: 44,
              fontWeight: 500,
              color: growthColor,
              lineHeight: 1,
            }}
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

        {/* Reliability */}
        {confidence > 0 && (
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
              <span
                style={{ fontSize: 11, color: accuracy.color, fontWeight: 500 }}
              >
                {accuracy.text}
              </span>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
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
      </div>

      {/* FOOTER */}
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          marginTop: 16,
          lineHeight: 1.5,
        }}
      >
        Prediksi menggunakan Linear Regression berdasarkan data historis
        penjualan produk ini
      </p>
    </div>
  );
}
