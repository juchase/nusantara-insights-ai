import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { extractAspect } from "@/lib/aspect-extractor";
import { getUserFromRequest } from "@/lib/auth";

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

  const userPayload = getUserFromRequest(req);

  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userPayload.userId,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

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
            let product = await prisma.product.findFirst({
              where: { name: productName },
            });

            if (!product) {
              try {
                product = await prisma.product.create({
                  data: {
                    name: productName,
                    userId: user.id,
                  },
                });
              } catch (err: any) {
                // 🔥 kalau race condition terjadi, ambil lagi
                product = await prisma.product.findFirst({
                  where: { name: productName },
                });
              }
            }

            if (!product) {
              console.error("❌ Product not found after upsert");
              return null;
            }

            // 🤖 AI CALL (SAFE)
            const aspect = extractAspect(reviewText);
            // ✅ Timeout 3 detik — kalau lambat langsung skip
            let sentiment = "neutral";
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);

              const aiRes = await fetch(`${AI_URL}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: reviewText }),
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (aiRes.ok) {
                const aiData = await aiRes.json();
                sentiment = aiData?.sentiment || "neutral";
              }
            } catch {
              // timeout atau error → pakai neutral, lanjut
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

            const salesValue = Number(normalized.sales);
            const salesDate = normalized.date
              ? new Date(normalized.date)
              : reviewDate; // fallback pakai reviewDate

            if (!isNaN(salesValue) && !isNaN(salesDate.getTime())) {
              await prisma.sales.upsert({
                where: {
                  productId_date: {
                    // ← perlu tambah @@unique ke schema
                    productId: product.id,
                    date: salesDate,
                  },
                },
                update: {
                  quantity: salesValue, // kalau tanggal sama → update quantity
                },
                create: {
                  productId: product.id,
                  date: salesDate,
                  quantity: salesValue,
                },
              });
            }

            console.log("📊 SALES:", {
              product: productName,
              sales: salesValue,
              date: salesDate,
            });

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
