import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Product } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const demoUserId = crypto.randomUUID();
    const email = `demo_${demoUserId}@temp.nusantarainsight.ai`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 jam

    let newProduct: Product | undefined;
    const hashedPassword = await bcrypt.hash("demo123", 10);

    // ── Transaksi atomik ──────────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // 1. Buat user demo
      const newUser = await tx.user.create({
        data: {
          id: demoUserId,
          email,
          name: "Pengguna Demo",
          password: hashedPassword,
          role: "DEMO",
          isDemo: true,
          expiresAt,
        },
      });

      // 2. Cari produk template
      const templateProduct = await tx.product.findFirst({
        include: { reviews: true, sales: true },
        where: { name: { contains: "semprotan angin" } },
      });

      let productId: string;

      if (templateProduct) {
        // ── Clone produk template ──────────────────────────────────────────
        const cloned = await tx.product.create({
          data: {
            id: crypto.randomUUID(),
            userId: newUser.id,
            name: templateProduct.name,
            category: templateProduct.category,
          },
        });
        productId = cloned.id;

        // Clone reviews
        if (templateProduct.reviews.length > 0) {
          const reviewData = templateProduct.reviews.map((review) => ({
            id: crypto.randomUUID(),
            productId: cloned.id,
            reviewText: review.reviewText,
            rating: review.rating,
            sentiment: review.sentiment,
            reviewDate: review.reviewDate,
            createdAt: new Date(),
          }));
          await tx.review.createMany({ data: reviewData });
        }

        // Clone sales
        if (templateProduct.sales.length > 0) {
          const salesData = templateProduct.sales.map((sale) => ({
            id: crypto.randomUUID(),
            productId: cloned.id,
            date: sale.date,
            quantity: sale.quantity,
            promotionFlag: sale.promotionFlag,
          }));
          await tx.sales.createMany({ data: salesData });
        }
      } else {
        // ── Buat produk dummy langsung ──────────────────────────────────────
        const dummyProduct = await tx.product.create({
          data: {
            id: crypto.randomUUID(),
            userId: newUser.id,
            name: "Semprotan Angin Air Gun Duster",
            category: "Elektronik",
          },
        });
        productId = dummyProduct.id;

        // Review dummy
        const reviews = [
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Produk sangat bagus, bersih dan tidak berdebu!",
            rating: 5,
            sentiment: "positive",
            reviewDate: new Date("2025-10-01"),
          },
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Semprotan anginnya kencang, puas.",
            rating: 4,
            sentiment: "positive",
            reviewDate: new Date("2025-10-05"),
          },
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Kemasan agak kurang rapi, tapi barangnya ok.",
            rating: 3,
            sentiment: "neutral",
            reviewDate: new Date("2025-10-10"),
          },
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Sayang barang datang terlambat.",
            rating: 2,
            sentiment: "negative",
            reviewDate: new Date("2025-10-12"),
          },
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Harga cukup mahal, tapi kualitas oke.",
            rating: 4,
            sentiment: "positive",
            reviewDate: new Date("2025-10-15"),
          },
        ];
        await tx.review.createMany({ data: reviews });

        // Sales dummy (10 data)
        const sales = [
          { date: new Date("2025-09-20"), quantity: 4 },
          { date: new Date("2025-09-24"), quantity: 6 },
          { date: new Date("2025-09-28"), quantity: 3 },
          { date: new Date("2025-10-02"), quantity: 8 },
          { date: new Date("2025-10-06"), quantity: 5 },
          { date: new Date("2025-10-10"), quantity: 7 },
          { date: new Date("2025-10-14"), quantity: 2 },
          { date: new Date("2025-10-18"), quantity: 9 },
          { date: new Date("2025-10-22"), quantity: 4 },
          { date: new Date("2025-10-26"), quantity: 6 },
        ];
        await tx.sales.createMany({
          data: sales.map((s) => ({
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            date: s.date,
            quantity: s.quantity,
            promotionFlag: Math.random() > 0.7,
          })),
        });
      }

      // ── Notifikasi dummy untuk user demo ──────────────────────────────
      const dummyNotifications = [
        {
          title: "Selamat Datang di NusantaraInsight AI!",
          message:
            "Anda sekarang menggunakan mode Demo. Upload dataset Anda untuk mulai analisis.",
          type: "info",
        },
        {
          title: "Produk Demo Berhasil Dibuat",
          message: `Produk "Semprotan Angin Air Gun Duster" telah ditambahkan ke dashboard Anda.`,
          type: "success",
        },
        {
          title: "Insight Tersedia",
          message:
            "AI telah menganalisis data. Cek halaman AI Insight untuk rekomendasi.",
          type: "info",
        },
        {
          title: "Tips Penggunaan",
          message:
            "Gunakan halaman Upload Data untuk menambahkan dataset ulasan dan penjualan.",
          type: "info",
        },
      ];

      await tx.notification.createMany({
        data: dummyNotifications.map((n) => ({
          userId: demoUserId,
          ...n,
          read: false,
          createdAt: new Date(),
        })),
      });

      const found = await tx.product.findUnique({
        where: { id: productId },
      });
      if (!found) throw new Error("Produk tidak ditemukan setelah transaksi.");
      newProduct = found;
    });

    // ── Panggil AI Pipeline (async, jangan tunggu) ──────────────────────
    try {
      if (!newProduct)
        throw new Error("Produk tidak ditemukan setelah transaksi.");
      await fetch(`http://localhost:8000/generate-insight/${newProduct.id}`, {
        method: "GET",
      });
    } catch (error) {
      console.warn(
        "⚠️ FastAPI tidak dijangkau. Insight akan di-generate nanti.",
      );
    }

    // ── Token & Cookie ──────────────────────────────────────────────────
    const token = signToken(
      {
        userId: demoUserId,
        role: "DEMO",
        isDemo: true,
        expiresAt: expiresAt.toISOString(),
      },
      "2h",
    );

    const response = NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("❌ Gagal membuat demo sandbox:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
