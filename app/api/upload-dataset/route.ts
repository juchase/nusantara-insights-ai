import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { extractAspect } from "@/lib/aspect-extractor";
import { getUserFromRequest } from "@/lib/auth";

const AI_URL = "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const csvText = await file.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const data = parsed.data as any[];
    console.log("📊 TOTAL BARIS DATA CSV:", data.length);

    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const BATCH_SIZE = 50;
    const CONCURRENT_LIMIT = 5;

    let success = 0;
    let skipped = 0;
    let duplicateReviews = 0;

    const normalize = (obj: any) => {
      const newObj: any = {};
      for (const key in obj) {
        newObj[key.trim().toLowerCase()] = obj[key];
      }
      return newObj;
    };

    const productCache = new Map<string, string>();

    // ── PROSES SEMUA BATCH ──────────────────────────────────────────────────
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      console.log(`📦 Memproses Batch ke-${Math.floor(i / BATCH_SIZE) + 1}`);

      // Daftarkan produk secara sinkronus sebelum Promise.all
      for (const item of batch) {
        const normalized = normalize(item);
        const productName = (normalized.product || "General Product").trim();

        if (!productCache.has(productName)) {
          let product = await prisma.product.findFirst({
            where: { name: productName, userId: user.id },
          });
          if (!product) {
            product = await prisma.product.create({
              data: { name: productName, userId: user.id },
            });
            console.log(`✨ Produk baru dibuat: ${productName}`);
          }
          productCache.set(productName, product.id);
        }
      }

      // Proses ulasan dan sales secara async per chunk
      for (let j = 0; j < batch.length; j += CONCURRENT_LIMIT) {
        const chunk = batch.slice(j, j + CONCURRENT_LIMIT);

        const results = await Promise.all(
          chunk.map(async (item, index) => {
            try {
              const normalized = normalize(item);
              const productName = (
                normalized.product || "General Product"
              ).trim();
              const reviewText =
                normalized.reviewtext ||
                normalized.review ||
                normalized.review_text;

              if (!reviewText) {
                console.warn("⚠️ Baris dilewati: teks ulasan kosong.");
                return null;
              }

              const rating = Number(normalized.rating || 3);
              const dateValue = normalized.date || normalized.review_date;
              let reviewDate: Date;

              if (dateValue) {
                reviewDate = new Date(dateValue);
              } else {
                const base = new Date();
                base.setDate(base.getDate() - (i + j + index));
                reviewDate = base;
              }

              if (isNaN(reviewDate.getTime())) {
                console.error(`❌ Format tanggal tidak valid: ${productName}`);
                return null;
              }

              const cachedProductId = productCache.get(productName);
              if (!cachedProductId) return null;

              const aspect = extractAspect(reviewText);
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
                sentiment = "neutral";
              }

              // ── UPSERT Review — aman dari duplikat ──────────────────────
              // Constraint unik: productId + reviewText + reviewDate
              // Upload ulang CSV yang sama tidak akan menambah data
              // Upload CSV minggu baru akan menambah baris baru (tanggal beda)
              await prisma.review.upsert({
                where: {
                  productId_reviewText_reviewDate: {
                    productId: cachedProductId,
                    reviewText: reviewText,
                    reviewDate: reviewDate,
                  },
                },
                update: {
                  // Update sentiment dan rating kalau model AI berubah
                  rating,
                  sentiment,
                  aspect,
                },
                create: {
                  productId: cachedProductId,
                  reviewText,
                  rating,
                  reviewDate,
                  sentiment,
                  aspect,
                },
              });

              // ── UPSERT Sales — sudah aman dari sebelumnya ────────────────
              // Constraint unik: productId + date
              // Data penjualan minggu baru otomatis ditambahkan
              const salesValue = Number(normalized.sales);
              const salesDate = dateValue ? new Date(dateValue) : reviewDate;

              if (
                !isNaN(salesValue) &&
                salesValue > 0 &&
                !isNaN(salesDate.getTime())
              ) {
                await prisma.sales.upsert({
                  where: {
                    productId_date: {
                      productId: cachedProductId,
                      date: salesDate,
                    },
                  },
                  update: { quantity: salesValue },
                  create: {
                    productId: cachedProductId,
                    date: salesDate,
                    quantity: salesValue,
                  },
                });
              }

              return true;
            } catch (err) {
              console.error("❌ Error pemrosesan baris:", err);
              return null;
            }
          }),
        );

        // ── Update keyword summary setelah setiap chunk ─────────────────────
        for (const [, cachedProductId] of productCache.entries()) {
          const allReviews = await prisma.review.findMany({
            where: { productId: cachedProductId },
            select: { reviewText: true },
          });

          const wordCounts: { [key: string]: number } = {};
          const stopWords = new Set([
            "dan",
            "yang",
            "di",
            "ke",
            "dari",
            "ini",
            "itu",
            "untuk",
            "dengan",
            "saya",
            "tapi",
            "agak",
            "tidak",
            "bisa",
            "sudah",
            "ada",
            "adalah",
            "akan",
            "atau",
            "kami",
            "kamu",
            "bgt",
            "banget",
            "aja",
            "saja",
          ]);

          allReviews.forEach((rev) => {
            const words = rev.reviewText
              .toLowerCase()
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
              .split(/\s+/);

            words.forEach((word) => {
              const cleanWord = word.trim();
              if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
                wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
              }
            });
          });

          const sortedWords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

          for (const [word, count] of sortedWords) {
            await prisma.keywordSummary.upsert({
              where: { productId_word: { productId: cachedProductId, word } },
              update: { count },
              create: { productId: cachedProductId, word, count },
            });
          }
        }

        success += results.filter(Boolean).length;
        skipped += results.length - results.filter(Boolean).length;
      }
    }

    // ── TRIGGER PROPHET + INSIGHT SEKALI SETELAH SEMUA BATCH SELESAI ───────
    console.log("🤖 Memulai pipeline AI untuk semua produk yang diupload...");

    const aiPipelineResults = await Promise.allSettled(
      Array.from(productCache.entries()).map(
        async ([productName, productId]) => {
          try {
            console.log(`📈 Prophet: ${productName}`);
            const forecastRes = await fetch(
              `${AI_URL}/predict-demand/${productId}`,
              { method: "POST" },
            );

            if (!forecastRes.ok) {
              console.warn(
                `⚠️ Prophet gagal untuk ${productName}: ${forecastRes.status}`,
              );
            } else {
              const forecastData = await forecastRes.json();
              console.log(
                `✅ Prophet selesai: ${productName} | confidence: ${forecastData.confidence}%`,
              );
            }

            console.log(`💡 Insight: ${productName}`);
            const insightRes = await fetch(
              `${AI_URL}/generate-insight/${productId}`,
              { method: "GET" },
            );

            if (!insightRes.ok) {
              console.warn(
                `⚠️ Insight gagal untuk ${productName}: ${insightRes.status}`,
              );
            } else {
              console.log(`✅ Insight selesai: ${productName}`);
            }

            return { productId, productName, status: "success" };
          } catch (err) {
            console.error(`❌ Pipeline AI gagal untuk ${productName}:`, err);
            return { productId, productName, status: "error" };
          }
        },
      ),
    );

    const aiSuccess = aiPipelineResults.filter(
      (r) => r.status === "fulfilled" && (r.value as any).status === "success",
    ).length;

    console.log(
      `🎉 Pipeline AI selesai: ${aiSuccess}/${productCache.size} produk berhasil`,
    );

    return NextResponse.json({
      message: "Proses upload data selesai dengan sukses",
      success,
      skipped,
      aiPipeline: {
        total: productCache.size,
        success: aiSuccess,
      },
    });
  } catch (globalError: any) {
    console.error("❌ CRITICAL ERROR:", globalError);
    return NextResponse.json(
      { error: "Internal Server Error", details: globalError.message },
      { status: 500 },
    );
  }
}
