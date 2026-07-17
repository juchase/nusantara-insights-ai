"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageSquareText,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { safeFetch } from "@/lib/safe-fetch";

type Review = {
  id: string;
  productId: string;
  reviewText: string;
  rating: number;
  sentiment: string | null;
  reviewDate: string;
  product?: {
    id: string;
    name: string;
    category: string | null;
  };
};

type ReviewsResponse = {
  data: Review[];
};

type ProductSummary = {
  id: string;
  name: string;
};

const sentimentStyles: Record<string, { label: string; className: string }> = {
  positive: {
    label: "Positif",
    className: "bg-secondary/15 text-secondary",
  },
  neutral: {
    label: "Netral",
    className: "bg-card text-muted",
  },
  negative: {
    label: "Negatif",
    className: "bg-danger/15 text-danger",
  },
  unknown: {
    label: "Belum ada",
    className: "bg-card text-muted",
  },
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [query, setQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const reviewsRes = await safeFetch<ReviewsResponse>("/api/reviews", {
          data: [],
        });
        setReviews(reviewsRes.data);

        const productsRes = await safeFetch<ProductSummary[]>(
          "/api/products",
          [],
        );
        setProducts(productsRes);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredReviews = useMemo(() => {
    const term = query.trim().toLowerCase();

    return reviews.filter((review) => {
      const sentiment = review.sentiment ?? "unknown";
      const matchesSentiment =
        sentimentFilter === "all" || sentiment === sentimentFilter;

      const matchesProduct =
        productFilter === "all" || review.productId === productFilter;

      const matchesSearch =
        !term ||
        [
          review.reviewText,
          review.product?.name,
          review.product?.category,
          sentiment,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(term));

      return matchesSentiment && matchesProduct && matchesSearch;
    });
  }, [reviews, query, sentimentFilter, productFilter]);

  const positive = reviews.filter(
    (review) => review.sentiment === "positive",
  ).length;
  const negative = reviews.filter(
    (review) => review.sentiment === "negative",
  ).length;
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-8 pt-4 lg:space-y-8 lg:pt-6 bg-background text-foreground">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Voice of Customer
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Ulasan</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Pantau ulasan pelanggan, sentimen, rating, dan aspek yang paling
            sering muncul.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex h-10 w-full items-center gap-2 rounded-lg bg-card border border-border px-3 sm:w-72 focus-within:border-primary">
            <Search size={16} className="text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              placeholder="Cari ulasan..."
            />
          </label>

          <select
            value={sentimentFilter}
            onChange={(event) => setSentimentFilter(event.target.value)}
            className="h-10 rounded-lg bg-card border border-border px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">Semua sentimen</option>
            <option value="positive">Positif</option>
            <option value="neutral">Netral</option>
            <option value="negative">Negatif</option>
          </select>

          <select
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            className="h-10 rounded-lg bg-card border border-border px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">Semua produk</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── 4 KARTU STATISTIK ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: <MessageSquareText size={20} />,
            label: "Total ulasan",
            value: reviews.length,
            accent: "text-tertiary",
          },
          {
            icon: <Star size={20} />,
            label: "Rating rata-rata",
            value: avgRating,
            accent: "text-primary",
          },
          {
            icon: <ThumbsUp size={20} />,
            label: "Positif",
            value: positive,
            accent: "text-secondary",
          },
          {
            icon: <ThumbsDown size={20} />,
            label: "Negatif",
            value: negative,
            accent: "text-danger",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="glass-card border border-border rounded-xl p-5 flex items-center gap-4"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card/80 border border-border ${item.accent}`}
            >
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-muted">{item.label}</p>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── TABEL ULASAN ─── */}
      <div className="glass-card border border-border overflow-hidden rounded-xl">
        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Daftar ulasan</p>
            <p className="text-xs text-muted">
              {filteredReviews.length} ulasan ditampilkan
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-card/50 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 w-1/3">Ulasan</th>
                <th className="px-6 py-3 w-1/4">Produk</th>
                <th className="px-6 py-3 w-20 text-center">Rating</th>
                <th className="px-6 py-3 w-28">Sentimen</th>
                <th className="px-6 py-3 w-24">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-muted" colSpan={5}>
                    Memuat ulasan...
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-muted" colSpan={5}>
                    Tidak ada ulasan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  const sentiment =
                    sentimentStyles[review.sentiment ?? "unknown"] ??
                    sentimentStyles.unknown;

                  return (
                    <tr
                      key={review.id}
                      className="hover:bg-card/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="line-clamp-2 text-sm text-foreground">
                          {review.reviewText}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">
                          {review.product?.name ?? "-"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {review.product?.category ?? "Tanpa kategori"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">
                        {review.rating}/5
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${sentiment.className}`}
                        >
                          {sentiment.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted">
                        {new Date(review.reviewDate).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
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
