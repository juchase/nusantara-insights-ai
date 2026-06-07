"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, Search, Star, ThumbsDown, ThumbsUp } from "lucide-react";

import { safeFetch } from "@/lib/safe-fetch";

type Review = {
  id: string;
  productId: string;
  reviewText: string;
  rating: number;
  sentiment: string | null;
  aspect: string;
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

const sentimentStyles: Record<string, { label: string; bg: string; color: string }> =
  {
    positive: { label: "Positif", bg: "#EAF3DE", color: "#3B6D11" },
    neutral: { label: "Netral", bg: "#f3f4f6", color: "#4b5563" },
    negative: { label: "Negatif", bg: "#FCEBEB", color: "#A32D2D" },
    unknown: { label: "Belum ada", bg: "#f3f4f6", color: "#6b7280" },
  };

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-semibold text-gray-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [query, setQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      const response = await safeFetch<ReviewsResponse>("/api/reviews", {
        data: [],
      });
      setReviews(response.data);
      setLoading(false);
    };

    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const term = query.trim().toLowerCase();

    return reviews.filter((review) => {
      const sentiment = review.sentiment ?? "unknown";
      const matchesSentiment =
        sentimentFilter === "all" || sentiment === sentimentFilter;
      const matchesSearch =
        !term ||
        [
          review.reviewText,
          review.product?.name,
          review.product?.category,
          review.aspect,
          sentiment,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(term));

      return matchesSentiment && matchesSearch;
    });
  }, [reviews, query, sentimentFilter]);

  const positive = reviews.filter((review) => review.sentiment === "positive").length;
  const negative = reviews.filter((review) => review.sentiment === "negative").length;
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 pb-8 pt-4 lg:space-y-6 lg:pt-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-700">
            Voice of Customer
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">Ulasan</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Pantau ulasan pelanggan, sentimen, rating, dan aspek yang paling
            sering muncul.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 sm:w-80">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              placeholder="Cari ulasan..."
            />
          </label>

          <select
            value={sentimentFilter}
            onChange={(event) => setSentimentFilter(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
          >
            <option value="all">Semua sentimen</option>
            <option value="positive">Positif</option>
            <option value="neutral">Netral</option>
            <option value="negative">Negatif</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<MessageSquareText size={18} />}
          label="Total ulasan"
          value={reviews.length}
        />
        <SummaryCard icon={<Star size={18} />} label="Rating rata-rata" value={avgRating} />
        <SummaryCard icon={<ThumbsUp size={18} />} label="Positif" value={positive} />
        <SummaryCard icon={<ThumbsDown size={18} />} label="Negatif" value={negative} />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-medium text-gray-950">Daftar ulasan</p>
          <p className="mt-1 text-xs text-gray-500">
            {filteredReviews.length} ulasan ditampilkan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3">Ulasan</th>
                <th className="px-5 py-3">Produk</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Sentimen</th>
                <th className="px-5 py-3">Aspek</th>
                <th className="px-5 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td className="px-5 py-8 text-center text-gray-400" colSpan={6}>
                    Memuat ulasan...
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-gray-400" colSpan={6}>
                    Tidak ada ulasan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  const sentiment =
                    sentimentStyles[review.sentiment ?? "unknown"] ??
                    sentimentStyles.unknown;

                  return (
                    <tr key={review.id} className="hover:bg-gray-50/70">
                      <td className="max-w-[420px] px-5 py-4">
                        <p className="line-clamp-2 text-gray-800">
                          {review.reviewText}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-950">
                          {review.product?.name ?? "-"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {review.product?.category ?? "Tanpa kategori"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-gray-900">{review.rating}/5</td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            background: sentiment.bg,
                            color: sentiment.color,
                          }}
                        >
                          {sentiment.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 capitalize text-gray-600">
                        {review.aspect}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(review.reviewDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
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
