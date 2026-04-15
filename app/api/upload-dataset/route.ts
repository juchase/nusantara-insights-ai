import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";

const AI_URL = "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
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

    // 👤 ensure user exists
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

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);

      console.log(`🚀 Processing batch ${i / BATCH_SIZE + 1}`);

      for (let j = 0; j < batch.length; j += CONCURRENT_LIMIT) {
        const chunk = batch.slice(j, j + CONCURRENT_LIMIT);

        const results = await Promise.all(
          chunk.map(async (item, index) => {
            try {
              const normalize = (obj: any) => {
                const newObj: any = {};
                for (const key in obj) {
                  newObj[key.toLowerCase()] = obj[key];
                }
                return newObj;
              };

              const normalizedItem = normalize(item);

              const productName = normalizedItem.product || "General Product";

              const reviewText =
                normalizedItem.review || normalizedItem.reviewtext;

              const rating = Number(normalizedItem.rating || 3);
              const dateValue = normalizedItem.date || new Date().toISOString();

              if (!productName || !reviewText) return null;
              if (!rating || isNaN(rating)) return null;

              const reviewDate = new Date(dateValue);
              if (isNaN(reviewDate.getTime())) return null;

              const product = await prisma.product.upsert({
                where: { name: productName },
                update: {},
                create: {
                  name: productName,
                  userId: user.id,
                },
              });

              // 🔥 AI CALL
              const aiRes = await fetch(`${AI_URL}/analyze`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: reviewText }),
              });

              if (!aiRes.ok) throw new Error("AI failed");

              const aiData = await aiRes.json();
              const sentiment = aiData?.sentiment || "neutral";

              await prisma.review.create({
                data: {
                  productId: product.id,
                  reviewText,
                  rating,
                  reviewDate,
                  sentiment,
                },
              });

              // 📊 daily summary
              const dateOnly = new Date(reviewDate);
              dateOnly.setHours(0, 0, 0, 0);

              await prisma.dailyReviewSummary.upsert({
                where: { date: dateOnly },
                update: { total: { increment: 1 } },
                create: { date: dateOnly, total: 1 },
              });

              // 📊 dashboard summary
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

              await prisma.sales.create({
                data: {
                  productId: product.id,
                  date: reviewDate,
                  quantity: Number(item.sales || 0),
                },
              });

              const text = reviewText
                .toLowerCase()
                .replace(/[^\w\s]/g, "")
                .split(" ");

              const stopwords = ["yang", "dan", "dari", "ini", "itu"];

              const filtered = text.filter(
                (word: string) => word.length > 3 && !stopwords.includes(word),
              );

              await Promise.all(
                filtered.map((word: string) =>
                  prisma.keywordSummary.upsert({
                    where: { word },
                    update: { count: { increment: 1 } },
                    create: { word, count: 1 },
                  }),
                ),
              );

              return true;
            } catch (err) {
              console.error("❌ ERROR ROW:", err);
              return null;
            }
          }),
        );

        success += results.filter(Boolean).length;
        skipped += results.length - results.filter(Boolean).length;
      }
    }
    console.log("✅ SUCCESS:", success);
    console.log("⚠️ SKIPPED:", skipped);

    return NextResponse.json({
      message: "Dataset uploaded",
      success,
      skipped,
    });
  } catch (error) {
    console.error("❌ UPLOAD ERROR:", error);

    return NextResponse.json(
      { error: "Failed to upload dataset" },
      { status: 500 },
    );
  }
}
