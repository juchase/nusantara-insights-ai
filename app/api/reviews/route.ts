import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const userPayload = getUserFromRequest(request);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ PERBAIKAN: Cari review berdasarkan kepemilikan produk milik user terpilih
  const reviews = await prisma.review.findMany({
    where: {
      product: {
        userId: userPayload.userId, // Melompat ke tabel Product untuk cek userId
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: {
      reviewDate: "desc",
    },
  });

  return NextResponse.json({
    data: reviews,
  });
}

export async function POST(request: NextRequest) {
  const userPayload = getUserFromRequest(request);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { reviewText, rating, productId, aspect, reviewDate } = body;

  // Validasi input dasar
  if (!reviewText || !productId || rating === undefined) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    // 🔌 call FastAPI backend untuk prediksi sentimen Linear SVC
    const aiRes = await fetch(
      process.env.NEXT_PUBLIC_API_BASE_URL + "/analyze" ??
        "http://127.0.0.1:8000/analyze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: reviewText }),
      },
    );

    if (!aiRes.ok) {
      throw new Error("FastAPI service error");
    }

    const aiData = await aiRes.json();

    // 💾 simpan ke DB PostgreSQL lewat Prisma
    const review = await prisma.review.create({
      data: {
        reviewText,
        rating: parseInt(rating),
        productId,
        // ✅ PERBAIKAN: Hapus properti 'id: userPayload.userId' agar ID Review digenerate otomatis berupa UUID baru
        sentiment: aiData.sentiment, // Mengambil string: 'positive' / 'negative' / 'netral'
        aspect: aspect || "lainnya",
        reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
      },
    });

    return NextResponse.json({
      data: review,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
