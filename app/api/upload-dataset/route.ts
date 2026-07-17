// app/api/upload/route.ts (Next.js)

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

              // ── Cek duplikat review ──────────────────────────────────────
              try {
                await prisma.review.upsert({
                  where: {
                    productId_reviewText_reviewDate: {
                      productId: cachedProductId,
                      reviewText,
                      reviewDate,
                    },
                  },
                  update: {}, // no change needed if it already exists
                  create: {
                    productId: cachedProductId,
                    reviewText,
                    rating,
                    reviewDate,
                    sentiment,
                  },
                });
              } catch (err: any) {
                // Jika error unik constraint (P2002), lewati saja agar proses tidak berhenti
                if (err.code === "P2002") {
                  console.warn(
                    `⚠ Lewati duplikat review: "${reviewText.substring(0, 20)}..."`,
                  );
                  // Jangan di-throw, cukup return null agar tidak dihitung sebagai success
                  return null;
                }
                // Jika error lain, lempar ke luar agar Promise.all menangkapnya
                throw err;
              }

              // ── UPSERT Sales ──────────────────────────────────────────────
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

        success += results.filter(Boolean).length;
        skipped += results.length - results.filter(Boolean).length;
      }
    }

    // ── Setelah SEMUA review tersimpan, update keyword summary untuk setiap produk ──
    console.log("🔄 Memperbarui Keyword Summary untuk semua produk...");
    for (const [productName, productId] of productCache.entries()) {
      try {
        const response = await fetch(
          `${AI_URL}/update-keyword-summary/${productId}`,
          {
            method: "POST",
          },
        );
        if (!response.ok) {
          console.warn(
            `⚠️ Gagal update keyword untuk ${productName} (${response.status})`,
          );
        } else {
          console.log(`✅ Keyword summary updated: ${productName}`);
        }
      } catch (err) {
        console.error(`❌ Error update keyword ${productName}:`, err);
      }
    }

    // ── TRIGGER PROPHET + INSIGHT ────────────────────────────────────────────
    const products = Array.from(productCache.entries());

    // Prophet paralel
    console.log(
      `📈 [1/2] Prophet untuk ${products.length} produk secara paralel...`,
    );
    const forecastResults = await Promise.allSettled(
      products.map(async ([productName, productId]) => {
        try {
          const forecastRes = await fetch(
            `${AI_URL}/predict-demand/${productId}`,
            { method: "POST" },
          );
          if (!forecastRes.ok) {
            console.warn(
              `⚠️ Prophet gagal: ${productName} (${forecastRes.status})`,
            );
            return { productId, productName, status: "error" };
          }
          const fd = await forecastRes.json();
          console.log(
            `✅ Prophet: ${productName} | confidence: ${fd.confidence}%`,
          );
          return { productId, productName, status: "success" };
        } catch (err) {
          console.error(`❌ Prophet error: ${productName}`, err);
          return { productId, productName, status: "error" };
        }
      }),
    );

    // Insight sequential
    console.log(
      `💡 [2/2] Insight bergiliran untuk ${products.length} produk...`,
    );
    let insightSuccess = 0;
    let insightFail = 0;

    for (const [productName, productId] of products) {
      try {
        console.log(
          `💡 [${insightSuccess + insightFail + 1}/${products.length}] ${productName}`,
        );
        const insightRes = await fetch(
          `${AI_URL}/generate-insight/${productId}`,
          { method: "GET" },
        );
        if (!insightRes.ok) {
          console.warn(
            `⚠️ Insight gagal: ${productName} (${insightRes.status})`,
          );
          insightFail++;
        } else {
          console.log(`✅ Insight selesai: ${productName}`);
          insightSuccess++;
        }
      } catch (err) {
        console.error(`❌ Insight error: ${productName}`, err);
        insightFail++;
      }
    }

    const prophetSuccess = forecastResults.filter(
      (r) => r.status === "fulfilled" && (r.value as any).status === "success",
    ).length;
    const aiSuccess = Math.min(prophetSuccess, insightSuccess);

    console.log(
      `🎉 Pipeline selesai — Prophet: ${prophetSuccess}/${products.length} | Insight: ${insightSuccess}/${products.length}`,
    );

    // ── KIRIM NOTIFIKASI KE USER ──────────────────────────────────────────
    await prisma.notification.create({
      data: {
        userId: userPayload.userId,
        title: "📊 Dataset Berhasil Diupload",
        message: `Dataset '${file.name}' telah diproses. ${success} data baru berhasil ditambahkan.`,
        type: "success",
      },
    });

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
