import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ PERBAIKAN: Cari review berdasarkan kepemilikan produk milik user terpilih
  const reviews = await prisma.review.findMany({
    where: {
      product: {
        userId: session.user.id, // Melompat ke tabel Product untuk cek userId
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { reviewText, rating, productId, aspect, reviewDate } = body ?? {};

  if (
    typeof reviewText !== "string" || !reviewText.trim() || reviewText.length > 10000 ||
    typeof productId !== "string" || !productId ||
    !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 ||
    (reviewDate !== undefined && Number.isNaN(new Date(reviewDate).getTime()))
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId: session.user.id },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const aiBaseUrl = process.env.AI_SERVICE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    const aiRes = await fetch(
      `${aiBaseUrl.replace(/\/$/, "")}/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: reviewText.trim() }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!aiRes.ok) {
      throw new Error("FastAPI service error");
    }

    const aiData = await aiRes.json();

    // 💾 simpan ke DB PostgreSQL lewat Prisma
    const review = await prisma.review.create({
      data: {
        reviewText: reviewText.trim(),
        rating: Number(rating),
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
