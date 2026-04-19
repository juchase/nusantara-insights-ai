import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { extractAspect } from "@/lib/aspect-extractor";

const AI_URL = "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const csvText = await file.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const data = parsed.data as any[];

  console.log("📊 TOTAL DATA:", data.length);

  // 🔥 DEMO USER
  const user = await prisma.user.upsert({
    where: { email: "demo@gmail.com" },
    update: {},
    create: {
      email: "demo@gmail.com",
      name: "Demo User",
      password: "123456",
    },
  });

  const BATCH_SIZE = 50;
  const CONCURRENT_LIMIT = 5;

  let success = 0;
  let skipped = 0;

  const normalize = (obj: any) => {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key.toLowerCase()] = obj[key];
    }
    return newObj;
  };

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);

    console.log(`🚀 Batch ${i / BATCH_SIZE + 1}`);

    for (let j = 0; j < batch.length; j += CONCURRENT_LIMIT) {
      const chunk = batch.slice(j, j + CONCURRENT_LIMIT);

      const results = await Promise.all(
        chunk.map(async (item, index) => {
          try {
            const normalized = normalize(item);

            const productName = normalized.product || "General Product";
            const reviewText = normalized.reviewtext || normalized.review;

            if (!reviewText) return null;

            const rating = Number(normalized.rating || 3);

            let reviewDate;

            if (normalized.date) {
              reviewDate = new Date(normalized.date);
            } else {
              // 🔥 fallback timeline biar chart hidup
              const base = new Date();
              base.setDate(base.getDate() - index);
              reviewDate = base;
            }

            if (isNaN(reviewDate.getTime())) return null;

            // 🔥 UPSERT PRODUCT (FIX UNIQUE ERROR)
            const product = await prisma.product.upsert({
              where: { name: productName },
              update: {},
              create: {
                name: productName,
                userId: user.id,
              },
            });

            // 🤖 AI CALL (SAFE)
            const aspect = extractAspect(reviewText);
            let sentiment = "neutral";

            try {
              const aiRes = await fetch(`${AI_URL}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: reviewText }),
              });

              if (aiRes.ok) {
                const aiData = await aiRes.json();
                sentiment = aiData?.sentiment || "neutral";
              }
            } catch (err) {
              console.log("⚠️ AI fallback:", reviewText);
            }

            // 💾 SAVE REVIEW
            await prisma.review.create({
              data: {
                productId: product.id,
                reviewText,
                rating,
                reviewDate,
                sentiment,
                aspect,
              },
            });

            // 📊 DASHBOARD SUMMARY
            await prisma.dashboardSummary.upsert({
              where: { id: "main" },
              update: {
                totalReviews: { increment: 1 },
                totalRating: { increment: rating },
                ...(sentiment === "positive" && {
                  positiveCount: { increment: 1 },
                }),
                ...(sentiment === "neutral" && {
                  neutralCount: { increment: 1 },
                }),
                ...(sentiment === "negative" && {
                  negativeCount: { increment: 1 },
                }),
              },
              create: {
                id: "main",
                totalReviews: 1,
                totalRating: rating,
                avgRating: rating,
                positiveCount: sentiment === "positive" ? 1 : 0,
                neutralCount: sentiment === "neutral" ? 1 : 0,
                negativeCount: sentiment === "negative" ? 1 : 0,
              },
            });

            // 📊 DAILY SUMMARY
            const dateOnly = new Date(reviewDate);
            dateOnly.setHours(0, 0, 0, 0);

            await prisma.dailyReviewSummary.upsert({
              where: { date: dateOnly },
              update: { total: { increment: 1 } },
              create: { date: dateOnly, total: 1 },
            });

            // 🧠 SMART COMPLAINT (FULL TEXT)
            if (sentiment === "negative") {
              const text = reviewText.toLowerCase();

              // 🔥 filter biar tidak semua masuk
              const negativeIndicators = [
                "tidak",
                "rusak",
                "lama",
                "buruk",
                "kecewa",
                "lambat",
              ];

              const isComplaint = negativeIndicators.some((w) =>
                text.includes(w),
              );

              if (isComplaint) {
                const cleanText = text
                  .replace(/[^\w\s]/g, "")
                  .replace(/\s+/g, " ")
                  .trim();

                if (sentiment === "negative") {
                  await prisma.keywordSummary.upsert({
                    where: { word: aspect },
                    update: { count: { increment: 1 } },
                    create: { word: aspect, count: 1 },
                  });
                }
              }
            }
            return true;
          } catch (err) {
            console.error("❌ ERROR:", err);
            return null;
          }
        }),
      );

      success += results.filter(Boolean).length;
      skipped += results.length - results.filter(Boolean).length;
    }
  }

  return NextResponse.json({
    message: "Upload selesai",
    success,
    skipped,
  });
}
