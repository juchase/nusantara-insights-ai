"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Package,
  Search,
  Star,
} from "lucide-react";

import { safeFetch } from "@/lib/safe-fetch";

type Product = {
  id: string;
  name: string;
  category: string | null;
  createdAt: string;
  _count?: {
    reviews: number;
    sales: number;
    predictions: number;
  };
  insights?: {
    healthScore: number;
    riskLevel: string;
    dominantIssue: string;
    updatedAt: string;
  }[];
};

const riskStyles: Record<string, { label: string; bg: string; color: string }> =
  {
    low: { label: "Rendah", bg: "bg-[#009B77]/15", color: "text-[#009B77]" },
    medium: { label: "Sedang", bg: "bg-[#F59E0B]/15", color: "text-[#F59E0B]" },
    high: { label: "Tinggi", bg: "bg-[#E24B4A]/15", color: "text-[#E24B4A]" },
    unknown: {
      label: "Belum ada",
      bg: "bg-[#1e293b]",
      color: "text-[#64748b]",
    },
  };

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass-card border border-border rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7F77DD]/15 text-[#7F77DD]">
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

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

    return products.filter((product) => {
      return [product.name, product.category, product.insights?.[0]?.riskLevel]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term));
    });
  }, [products, query]);

  const totalReviews = products.reduce(
    (sum, product) => sum + (product._count?.reviews ?? 0),
    0,
  );
  const productsWithInsights = products.filter(
    (product) => product.insights && product.insights.length > 0,
  ).length;
  const highRiskProducts = products.filter(
    (product) => product.insights?.[0]?.riskLevel === "high",
  ).length;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            Inventory Analytics
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Produk</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Ringkasan produk, volume ulasan, status prediksi, dan risiko bisnis
            terbaru.
          </p>
        </div>

        <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-[#1e293b]/50 px-3 lg:w-80 focus-within:border-[#F59E0B]">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Cari produk..."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<Package size={18} />}
          label="Total produk"
          value={products.length}
        />
        <MetricTile
          icon={<Star size={18} />}
          label="Total ulasan"
          value={totalReviews}
        />
        <MetricTile
          icon={<CheckCircle2 size={18} />}
          label="Sudah dianalisis"
          value={productsWithInsights}
        />
        <MetricTile
          icon={<AlertTriangle size={18} />}
          label="Risiko tinggi"
          value={highRiskProducts}
        />
      </div>

      <div className="overflow-hidden rounded-xl glass-card border border-border p-5">
        <div className="flex items-center justify-between border-b border-border px-1 pb-4 mb-2">
          <div>
            <p className="text-sm font-medium text-white">Daftar produk</p>
            <p className="mt-1 text-xs text-slate-400">
              {filteredProducts.length} produk ditampilkan
            </p>
          </div>
          <BarChart3 size={18} className="text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-[#1e293b]/50 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3">Produk</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3">Ulasan</th>
                <th className="px-5 py-3">Sales</th>
                <th className="px-5 py-3">Health</th>
                <th className="px-5 py-3">Risiko</th>
                <th className="px-5 py-3">Isu dominan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-slate-400"
                    colSpan={7}
                  >
                    Memuat produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-slate-400"
                    colSpan={7}
                  >
                    Tidak ada produk yang cocok.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const insight = product.insights?.[0];
                  const risk =
                    riskStyles[insight?.riskLevel ?? "unknown"] ??
                    riskStyles.unknown;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#1e293b]/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(product.createdAt).toLocaleDateString(
                            "id-ID",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {product.category ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-white">
                        {product._count?.reviews ?? 0}
                      </td>
                      <td className="px-5 py-4 text-white">
                        {product._count?.sales ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-white">
                          {insight?.healthScore ?? "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${risk.bg} ${risk.color}`}
                        >
                          {risk.label}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-5 py-4 text-slate-400">
                        <span className="line-clamp-1">
                          {insight?.dominantIssue ?? "-"}
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
    </div>
  );
}
