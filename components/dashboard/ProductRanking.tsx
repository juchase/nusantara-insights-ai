"use client";

import { useEffect, useState } from "react";
import { Trophy, AlertTriangle, MessageSquareWarning } from "lucide-react";
import CardSkeleton from "./skeleton/CardSkeleton";

interface ProductRank {
  id: string;
  name: string;
  totalReviews: number;
  positiveRate: number;
  negativeRate: number;
  healthScore: number;
  riskLevel: string;
  dominantIssue: string;
}

interface RankingData {
  best: ProductRank | null;
  worst: ProductRank | null;
  mostComplaints: ProductRank | null;
  all: ProductRank[];
  total: number;
}

const RISK_STYLE: Record<string, { bg: string; color: string; label: string }> =
  {
    low: { bg: "#EAF3DE", color: "#3B6D11", label: "Rendah" },
    medium: { bg: "#FAEEDA", color: "#854F0B", label: "Sedang" },
    high: { bg: "#FCEBEB", color: "#A32D2D", label: "Tinggi" },
    unknown: { bg: "#f3f4f6", color: "#6b7280", label: "—" },
  };

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "#1D9E75" : value >= 45 ? "#EF9F27" : "#E24B4A";
  return (
    <div
      style={{
        flex: 1,
        height: 6,
        background: "#f3f4f6",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: 3,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

function TopCard({
  icon,
  label,
  iconColor,
  iconBg,
  product,
}: {
  icon: React.ReactNode;
  label: string;
  iconColor: string;
  iconBg: string;
  product: ProductRank | null;
}) {
  if (!product) return null;
  const risk = RISK_STYLE[product.riskLevel] ?? RISK_STYLE.unknown;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
          }}
        >
          {icon}
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </p>
      </div>

      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#111827",
          marginBottom: 10,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {product.name}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{ fontSize: 11, color: "#6b7280", width: 64, flexShrink: 0 }}
        >
          Health
        </span>
        <ScoreBar value={product.healthScore} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#111827",
            width: 32,
            textAlign: "right",
          }}
        >
          {product.healthScore}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{ fontSize: 11, color: "#6b7280", width: 64, flexShrink: 0 }}
        >
          Positif
        </span>
        <div
          style={{
            flex: 1,
            height: 6,
            background: "#f3f4f6",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${product.positiveRate}%`,
              background: "#1D9E75",
              borderRadius: 3,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#111827",
            width: 32,
            textAlign: "right",
          }}
        >
          {product.positiveRate}%
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {product.totalReviews} ulasan
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: 20,
            background: risk.bg,
            color: risk.color,
          }}
        >
          {risk.label}
        </span>
      </div>
    </div>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          minWidth: 600,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ProductRanking() {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/product-ranking")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CardSkeleton />;
  if (!data || data.total === 0) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      {/* Header */}
      <div
        className="flex-col gap-3 sm:flex-row sm:items-center"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>
            Performa Produk
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Perbandingan {data.total} produk berdasarkan health score
          </p>
        </div>
        {data.total > 3 && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              fontSize: 12,
              color: "#4f46e5",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {`Lihat semua (${data.total})`}
          </button>
        )}
      </div>

      {/* Top cards */}
      <div
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
        style={{
          marginBottom: 16,
        }}
      >
        <TopCard
          label="Terbaik"
          icon={<Trophy size={14} />}
          iconColor="#3B6D11"
          iconBg="#EAF3DE"
          product={data.best}
        />
        <TopCard
          label="Perlu Perhatian"
          icon={<AlertTriangle size={14} />}
          iconColor="#854F0B"
          iconBg="#FAEEDA"
          product={data.worst}
        />
        <TopCard
          label="Keluhan Terbanyak"
          icon={<MessageSquareWarning size={14} />}
          iconColor="#A32D2D"
          iconBg="#FCEBEB"
          product={data.mostComplaints}
        />
      </div>

      {/* Modal daftar produk */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Daftar Produk">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              minWidth: "560px", // Ditambah lebarnya agar pas dengan tabel ber-header
              maxWidth: "600px",
              boxSizing: "border-box",
            }}
          >
            {/* 1. HEADER TABEL (Sejajar dengan isi data) */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "12px",
                padding: "6px 12px", // Menyesuaikan padding kiri-kanan data di bawah
                marginBottom: "6px",
                borderBottom: "1px solid #e5e7eb", // Garis pembatas header
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  width: "28px",
                }}
              >
                RANK
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  flex: 1,
                }}
              >
                PRODUK
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  width: "130px",
                }}
              >
                HEALTH SCORE
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  width: "42px",
                  textAlign: "right",
                }}
              >
                POSITIF
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  width: "56px",
                  textAlign: "center",
                }}
              >
                RISIKO
              </span>
            </div>

            {/* 2. DAFTAR PRODUK (Scrollable Area) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                maxHeight: "50vh", // Membatasi tinggi daftar agar pas di tengah layar
                overflowY: "auto",
                paddingRight: "4px",
                boxSizing: "border-box",
              }}
            >
              {data.all.map((p, i) => {
                const risk = RISK_STYLE[p.riskLevel] || RISK_STYLE.unknown;
                const isTopThree = i < 3;
                const isFirst = i === 0;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: isFirst ? "#f3f4f6" : "transparent",
                      border: isFirst
                        ? "1px solid #e5e7eb"
                        : "1px solid transparent",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Peringkat */}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isTopThree ? "#4f46e5" : "#9ca3af",
                        width: "28px",
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </span>

                    {/* Nama Produk */}
                    <span
                      title={p.name}
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#111827",
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.name}
                    </span>

                    {/* Health Score */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "6px",
                        width: "130px",
                        flexShrink: 0,
                      }}
                    >
                      <ScoreBar value={p.healthScore} />
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#111827",
                          width: "24px",
                          textAlign: "right",
                        }}
                      >
                        {p.healthScore}
                      </span>
                    </div>

                    {/* Positif */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#374151",
                        width: "42px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {p.positiveRate}%
                    </span>

                    {/* Risiko */}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "10px",
                        background: risk.bg,
                        color: risk.color,
                        flexShrink: 0,
                        width: "56px",
                        textAlign: "center",
                        textTransform: "uppercase",
                      }}
                    >
                      {risk.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
