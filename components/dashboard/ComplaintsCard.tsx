"use client";

export default function ComplaintsCard({ data }: { data: [string, number][] }) {
  const maxCount = Math.max(...data.map(([, count]) => count), 1);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "20px 24px",
      }}
    >
      <p
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        Keluhan Pelanggan
      </p>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>
        Kata yang paling sering muncul di ulasan produk ini
      </p>

      {data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Belum ada data keluhan untuk produk ini
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map(([word, count], i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "#374151",
                  width: 90,
                  flexShrink: 0,
                  textTransform: "capitalize",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {word}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "#f3f4f6",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: i === 0 ? "#E24B4A" : "#534AB7",
                    width: `${(count / maxCount) * 100}%`,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  width: 64,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {count} sebutan
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
