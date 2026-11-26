// app/api/upload/route.ts (Next.js)

import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { extractAspect } from "@/lib/aspect-extractor";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const AI_URL = process.env.AI_SERVICE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

function parseDateOnly(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) return null;

  let year: number;
  let month: number;
  let day: number;

  // Format ISO: YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else {
    // Format Indonesia: DD/MM/YYYY
    const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (!dmyMatch) {
      return null;
    }

    day = Number(dmyMatch[1]);
    month = Number(dmyMatch[2]);
    year = Number(dmyMatch[3]);
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  // Validasi tanggal.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

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

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const BATCH_SIZE = 50;
    const CONCURRENT_LIMIT = 5;

    let success = 0;
    let skipped = 0;

    const salesProductIds = new Set<string>();

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
          chunk.map(async (item) => {
            const normalized = normalize(item);

            const productName = String(
              normalized.product || "General Product",
            ).trim();

            const productId = productCache.get(productName);

            if (!productId) {
              console.error(`Produk tidak ditemukan: ${productName}`);
              return false;
            }

            const reviewText = String(
              normalized.reviewtext ||
                normalized.review ||
                normalized.review_text ||
                "",
            ).trim();

            const dateValue = normalized.date || normalized.review_date;

            // Tanggal wajib valid jika baris berisi review atau sales.
            if (!dateValue) {
              console.warn(`Tanggal kosong: ${productName}`);
              return false;
            }

            const recordDate = parseDateOnly(dateValue);

            console.log("[UPLOAD DATE DEBUG]", {
              product: productName,
              rawDate: dateValue,
              parsedDate: recordDate?.toISOString() ?? null,
            });

            if (!recordDate) {
              console.warn(`Tanggal tidak valid: ${dateValue}`);
              return false;
            }

            if (Number.isNaN(recordDate.getTime())) {
              console.warn(`Tanggal tidak valid: ${dateValue}`);
              return false;
            }

            let rowProcessed = false;

            // ==========================================
            // 1. SIMPAN SALES SECARA INDEPENDEN
            // ==========================================
            const rawSales = normalized.sales;
            const hasSales =
              rawSales !== undefined &&
              rawSales !== null &&
              String(rawSales).trim() !== "";

            if (hasSales) {
              const salesValue = Number(rawSales);

              if (Number.isInteger(salesValue) && salesValue >= 0) {
                try {
                  const savedSales = await prisma.sales.upsert({
                    where: {
                      productId_date: {
                        productId,
                        date: recordDate,
                      },
                    },
                    update: {
                      quantity: salesValue,
                    },
                    create: {
                      productId,
                      date: recordDate,
                      quantity: salesValue,
                    },
                  });

                  console.log("[DB SALES SAVED]", {
                    id: savedSales.id,
                    productId: savedSales.productId,
                    quantity: savedSales.quantity,
                  });

                  salesProductIds.add(productId);
                  rowProcessed = true;
                } catch (error) {
                  console.error(`Gagal menyimpan sales ${productName}:`, error);
                }
              } else {
                console.warn(`Nilai sales tidak valid: ${rawSales}`);
              }
            }

            // ==========================================
            // 2. SIMPAN REVIEW JIKA ADA TEKS ULASAN
            // ==========================================
            if (reviewText) {
              const rating = Number(normalized.rating);

              // Rating harus 1-5. Jangan membuat rating default.
              if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
                try {
                  const aspect = extractAspect(reviewText);
                  let sentiment = "neutral";

                  try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(
                      () => controller.abort(),
                      3000,
                    );

                    try {
                      const aiRes = await fetch(`${AI_URL}/analyze`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          text: reviewText,
                        }),
                        signal: controller.signal,
                      });

                      if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        sentiment = aiData?.sentiment || "neutral";
                      }
                    } finally {
                      clearTimeout(timeoutId);
                    }
                  } catch {
                    sentiment = "neutral";
                  }

                  const savedReview = await prisma.review.upsert({
                    where: {
                      productId_reviewText_reviewDate: {
                        productId,
                        reviewText,
                        reviewDate: recordDate,
                      },
                    },
                    update: {},
                    create: {
                      productId,
                      reviewText,
                      rating,
                      reviewDate: recordDate,
                      sentiment,
                      aspect,
                    },
                  });

                  console.log("[DB REVIEW SAVED]", {
                    id: savedReview.id,
                    productId: savedReview.productId,
                    rating: savedReview.rating,
                  });

                  rowProcessed = true;
                } catch (error: any) {
                  if (error?.code === "P2002") {
                    console.warn(`Review duplikat dilewati: ${productName}`);
                  } else {
                    console.error(
                      `Gagal menyimpan review ${productName}:`,
                      error,
                    );
                  }
                }
              } else {
                console.warn(
                  `Review dilewati karena rating tidak valid: ${productName}`,
                );
              }
            }

            return rowProcessed;
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

    // ── TRIGGER FORECASTING V2 + INSIGHT ───────────────────────────────────
    // Satu pipeline resmi: V2 Daily -> V2 Weekly -> Insight dari hasil V2 Daily.
    // Tidak memanggil endpoint legacy /predict-demand atau GET /generate-insight.
    const products = Array.from(productCache.entries()).filter(
      ([, productId]) => salesProductIds.has(productId),
    );

    let forecastSuccess = 0;
    let insightSuccess = 0;
    let pipelineSuccess = 0;
    const pipelineResults: Array<{
      productId: string;
      productName: string;
      daily: "success" | "error";
      weekly: "success" | "error";
      insight: "success" | "error" | "skipped";
    }> = [];

    if (!INTERNAL_API_SECRET) {
      console.error("INTERNAL_API_SECRET belum dikonfigurasi; pipeline AI dilewati.");
    } else {
      // Proses per produk secara berurutan untuk menghindari lonjakan komputasi Prophet.
      for (const [productName, productId] of products) {
        const result: {
          productId: string;
          productName: string;
          daily: "success" | "error";
          weekly: "success" | "error";
          insight: "success" | "error" | "skipped";
        } = {
          productId,
          productName,
          daily: "error",
          weekly: "error",
          insight: "skipped",
        };

        for (const frequency of ["D", "W"] as const) {
          try {
            const forecastRes = await fetch(
              `${AI_URL}/forecast/v2/${encodeURIComponent(productId)}?frequency=${frequency}`,
              {
                method: "POST",
                headers: { "x-internal-api-secret": INTERNAL_API_SECRET },
                cache: "no-store",
              },
            );

            if (!forecastRes.ok) {
              const detail = await forecastRes.text();
              console.warn(
                `Forecasting V2 ${frequency} gagal untuk ${productName} (${forecastRes.status}): ${detail}`,
              );
              result[frequency === "D" ? "daily" : "weekly"] = "error";
              continue;
            }

            result[frequency === "D" ? "daily" : "weekly"] = "success";
            console.log(`✅ Forecasting V2 ${frequency}: ${productName}`);
          } catch (error) {
            console.error(`❌ Forecasting V2 ${frequency} error untuk ${productName}:`, error);
          }
        }

        if (result.daily === "success") {
          forecastSuccess++;
          try {
            const insightRes = await fetch(
              `${AI_URL}/generate-insight/${encodeURIComponent(productId)}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-internal-api-secret": INTERNAL_API_SECRET,
                },
                body: JSON.stringify({ frequency: "D" }),
                cache: "no-store",
              },
            );

            if (insightRes.ok) {
              result.insight = "success";
              insightSuccess++;
              console.log(`✅ Insight dari Forecasting V2 selesai: ${productName}`);
            } else {
              result.insight = "error";
              console.warn(
                `⚠️ Insight gagal untuk ${productName} (${insightRes.status}): ${await insightRes.text()}`,
              );
            }
          } catch (error) {
            result.insight = "error";
            console.error(`❌ Insight error untuk ${productName}:`, error);
          }
        }

        if (
          result.daily === "success" &&
          result.weekly === "success" &&
          result.insight === "success"
        ) {
          pipelineSuccess++;
        }
        pipelineResults.push(result);
      }
    }

    console.log(
      `🎉 Pipeline V2 selesai — Daily: ${forecastSuccess}/${products.length} | Insight: ${insightSuccess}/${products.length} | Lengkap: ${pipelineSuccess}/${products.length}`,
    );

    // ── KIRIM NOTIFIKASI KE USER ──────────────────────────────────────────
    await prisma.notification.create({
      data: {
        userId: session.user.id,
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
        total: products.length,
        forecastDailySuccess: forecastSuccess,
        insightSuccess,
        completeSuccess: pipelineSuccess,
        results: pipelineResults,
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
