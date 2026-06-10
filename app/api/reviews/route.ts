import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const userPayload = getUserFromRequest(request);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    where: {
      id: userPayload.userId,
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

// 🔥 TAMBAHKAN INI
export async function POST(request: NextRequest) {
  const userPayload = getUserFromRequest(request);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { reviewText, rating, productId, aspect, reviewDate } = body;

  // 🔌 call FastAPI
  const aiRes = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: reviewText }),
  });

  const aiData = await aiRes.json();

  // 💾 simpan ke DB
  const review = await prisma.review.create({
    data: {
      reviewText,
      rating,
      productId,
      id: userPayload.userId,
      sentiment: aiData.sentiment, // 🔥 hasil AI
      aspect: aspect || "lainnya",
      reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
    },
  });

  return NextResponse.json({
    data: review,
  });
}
