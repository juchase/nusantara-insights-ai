import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { analyzeSentiment, generateInsightAI } from "@/lib/ai-client";
import { calculateSentiment, extractKeywords } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const csvText = await file.text();

  const parsed = Papa.parse(csvText, {
    header: true,
  });

  const data = parsed.data as any[];

  const user = await prisma.user.upsert({
    where: { email: "demo@gmail.com" },
    update: {},
    create: {
      email: "demo@gmail.com",
      name: "Demo User",
      password: "123456",
    },
  });

  let success = 0;
  let skipped = 0;

  const collectedReviews: any[] = [];

  for (const item of data) {
    if (!item.product || !item.review) {
      skipped++;
      continue;
    }

    const productId = item.product || item.Product;
    const reviewText = item.review || item.Review;
    const rating = Number(item.rating || item.Rating);
    const dateValue = item.date || item.Date;

    const reviewDate = new Date(dateValue);

    if (!rating || isNaN(rating)) continue;
    if (isNaN(reviewDate.getTime())) continue;

    const product = await prisma.product.upsert({
      where: { name: productId },
      update: {},
      create: {
        name: productId,
        userId: user.id,
      },
    });

    const sentimentRes = await analyzeSentiment(reviewText);

    collectedReviews.push({
      productId: product.id,
      reviewText,
      sentiment: sentimentRes.sentiment,
      rating,
      reviewDate,
    });

    await prisma.review.create({
      data: {
        productId: product.id,
        reviewText,
        rating,
        sentiment: sentimentRes.sentiment, // 🔥 AI masuk sini
        reviewDate: reviewDate,
      },
    });

    await prisma.sales.create({
      data: {
        product: { connect: { id: product.id } },
        date: reviewDate,
        quantity: Number(item.sales || 0),
      },
    });
    success++;
  }

  const keywords = extractKeywords(collectedReviews);
  const sentiment = calculateSentiment(collectedReviews);

  const insightRes = await generateInsightAI(sentiment, keywords);

  await prisma.insight.create({
    data: {
      productId: collectedReviews[0]?.productId,
      insightText: insightRes.insight,
    },
  });

  return NextResponse.json({
    message: "Dataset uploaded",
    success,
    skipped,
    collectedReviews,
  });
}
