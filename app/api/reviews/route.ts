import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const reviews = await prisma.review.findMany();

  return NextResponse.json({
    data: reviews,
  });
}

// 🔥 TAMBAHKAN INI
export async function POST(req: Request) {
  const body = await req.json();

  const { reviewText, rating, productId } = body;

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
      sentiment: aiData.sentiment, // 🔥 hasil AI
    },
  });

  return NextResponse.json({
    data: review,
  });
}
