"use client";

import { InsightResponse } from "@/types/insight";
import { Cpu, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import InsightCardSkeleton from "@/components/dashboard/skeleton/InsightCardSkeleton";

interface Props {
  insight: InsightResponse | null;
  products: { id: string; name: string }[];
  selectedProduct: string;
  onProductChange: (value: string) => void;
  loading: boolean;
}

export default function InsightCard({
  insight,
  products,
  selectedProduct,
  onProductChange,
  loading,
}: Props) {
  const healthColor = (label: string) => {
    if (label === "Sangat Baik" || label === "Baik")
      return { background: "rgba(29,158,117,0.25)", color: "#5DCAA5" };
    if (label === "Perlu Perhatian")
      return { background: "rgba(239,159,39,0.25)", color: "#EF9F27" };
    return { background: "rgba(226,75,74,0.25)", color: "#E24B4A" };
  };

  const riskBadge = (risk?: string) => {
    if (risk === "high")
      return {
        bg: "rgba(226,75,74,0.2)",
        color: "#E24B4A",
        label: "Risiko Tinggi",
      };
    if (risk === "medium")
      return {
        bg: "rgba(239,159,39,0.2)",
        color: "#EF9F27",
        label: "Risiko Sedang",
      };
    return {
      bg: "rgba(29,158,117,0.2)",
      color: "#5DCAA5",
      label: "Risiko Rendah",
    };
  };

  const risk = riskBadge(insight?.risk_level);

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return <InsightCardSkeleton />;
  }

  // ── EMPTY TOTAL — user baru, belum punya satu produk pun. Ini SATU-SATUNYA
  // komponen yang tampil mencolok dengan CTA besar saat kosong; komponen
  // dashboard lainnya sembunyikan diri sepenuhnya (return null) supaya tidak
  // berisik mengulang CTA yang sama di banyak tempat. ──────────────────────
  if (products.length === 0) {
    return (
      <div
        className="mt-4 overflow-hidden rounded-2xl sm:mt-5 lg:mt-6"
        style={{ background: "#1a1a2e" }}
      >
        <div
          style={{
            padding: "48px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(127,119,221,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={26} style={{ color: "#AFA9EC" }} />
          </div>

          <div>
            <p
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "#fff",
                marginBottom: 6,
              }}
            >
              Belum ada data untuk dianalisis
            </p>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.6,
                maxWidth: 420,
              }}
            >
              Upload dataset ulasan dan penjualan produk Anda untuk mulai
              melihat insight bisnis, prediksi permintaan, dan analisis sentimen
              pelanggan.
            </p>
          </div>

          <Link
            href="/dashboard/upload"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              background: "#7F77DD",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <Upload size={15} />
            Upload Dataset Pertama
          </Link>
        </div>
      </div>
    );
  }

  // ── PRODUK ADA TAPI INSIGHT BELUM SIAP (misal pipeline AI masih proses) ──
  // Bukan empty total -- tetap tampilkan layout penuh + product selector,
  // hanya bagian summary yang menunjukkan status "belum siap".
  return (
    <div
      className="mt-4 overflow-hidden rounded-2xl sm:mt-5 lg:mt-6"
      style={{ background: "#1a1a2e" }}
    >
      {/* HEADER ROW */}
      <div
        className="flex-col gap-4 sm:flex-row sm:items-center"
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(127,119,221,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={16} style={{ color: "#AFA9EC" }} />
          </div>
          <div>
            <p
              style={{
                fontSize: 10,
                color: "#7F77DD",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Business Status
            </p>
            {insight && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: risk.bg,
                  color: risk.color,
                  marginTop: 3,
                  display: "inline-block",
                }}
              >
                {risk.label}
              </span>
            )}
          </div>
        </div>

        {/* Product selector + Health Score */}
        <div
          className="w-full flex-col items-stretch sm:w-auto sm:flex-row sm:items-center"
          style={{
            display: "flex",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div
            className="w-full sm:w-auto"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 5,
              }}
            >
              Produk aktif
            </p>
            <select
              value={selectedProduct}
              onChange={(e) => onProductChange(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "350px", // Tetap batasi select utamanya
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "5px 8px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {products.map((p) => {
                // POTONG TEKS DI SINI: Jika lebih dari 40 karakter, potong dan tambahkan "..."
                const maxLength = 40;
                const truncatedName =
                  p.name.length > maxLength
                    ? p.name.substring(0, maxLength) + "..."
                    : p.name;

                return (
                  <option
                    key={p.id}
                    value={p.id}
                    style={{ background: "#1a1a2e" }}
                    title={p.name} // Atribut ini agar nama lengkap tetap muncul saat user mengarahkan kursor (hover)
                  >
                    {truncatedName}
                  </option>
                );
              })}
            </select>
          </div>

          {insight && (
            <div className="text-left sm:text-right">
              <p
                className="text-[26px] sm:text-[30px]"
                style={{
                  fontWeight: 500,
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                {insight.health_score} / 100
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 2,
                }}
              >
                HEALTH SCORE
              </p>
              <span
                style={{
                  ...healthColor(insight.health_label ?? ""),
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: 20,
                  display: "inline-block",
                  marginTop: 4,
                }}
              >
                {insight.health_label ?? "—"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div style={{ padding: "16px 24px 20px" }}>
        {insight?.executive_summary ? (
          <p
            style={{
              fontSize: 14,
              color: "#e8e8f0",
              lineHeight: 1.7,
              marginBottom: 12,
            }}
          >
            {insight.executive_summary}
          </p>
        ) : (
          <p
            style={{
              fontSize: 14,
              color: "#e8e8f0",
              lineHeight: 1.7,
              marginBottom: 12,
            }}
          >
            Produk ini belum memiliki insight. Pipeline AI mungkin masih
            memproses data, atau belum ada ulasan/penjualan yang diupload untuk
            produk ini.
          </p>
        )}

        {insight?.summary ? (
          <>
            {insight.summary !== insight.executive_summary && (
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: 10,
                  marginTop: 4,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.6,
                  }}
                >
                  {insight.summary}
                </p>
              </div>
            )}
          </>
        ) : (
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.6,
            }}
          >
            Upload ulasan dan data penjualan untuk produk ini agar AI dapat
            menghasilkan insight.
          </p>
        )}

        {/* Footer badges */}
        <div
          className="flex-wrap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: 20,
              background: "rgba(83,74,183,0.3)",
              color: "#AFA9EC",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Cpu size={11} /> Qwen2.5 Enhanced
          </span>
          {insight?.llm_used === false && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
              Rule engine fallback
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
