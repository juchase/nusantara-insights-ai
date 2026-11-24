import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Product } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const demoUserId = crypto.randomUUID();
    const email = `demo_${demoUserId}@temp.nusantarainsight.ai`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const hashedPassword = await bcrypt.hash("demo123", 10);

    let newProduct: Product | undefined;

    // ── Transaksi atomik ──────────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
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

      // Cari produk template
      const templateProduct = await tx.product.findFirst({
        include: { reviews: true, sales: true },
        where: { name: { contains: "semprotan angin" } },
      });

      let productId: string;

      if (templateProduct) {
        const cloned = await tx.product.create({
          data: {
            id: crypto.randomUUID(),
            userId: newUser.id,
            name: templateProduct.name,
            category: templateProduct.category,
          },
        });
        productId = cloned.id;

        // Clone reviews – hanya ambil field yang diperlukan, tanpa menyebarkan id/productId
        if (templateProduct.reviews.length) {
          const reviewData = templateProduct.reviews.map((r) => ({
            id: crypto.randomUUID(),
            productId: cloned.id,
            reviewText: r.reviewText,
            rating: r.rating,
            sentiment: r.sentiment,
            reviewDate: r.reviewDate,
            createdAt: new Date(),
          }));
          await tx.review.createMany({ data: reviewData });
        }

        // Clone sales
        if (templateProduct.sales.length) {
          const salesData = templateProduct.sales.map((s) => ({
            id: crypto.randomUUID(),
            productId: cloned.id,
            date: s.date,
            quantity: s.quantity,
            promotionFlag: s.promotionFlag,
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

        // Review dummy (5 data)
        const reviews = [
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Produk sangat bagus, bersih dan tidak berdebu!",
            rating: 5,
            sentiment: "positive",
            reviewDate: new Date("2025-10-01"),
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Semprotan anginnya kencang, puas.",
            rating: 4,
            sentiment: "positive",
            reviewDate: new Date("2025-10-05"),
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Kemasan agak kurang rapi, tapi barangnya ok.",
            rating: 3,
            sentiment: "neutral",
            reviewDate: new Date("2025-10-10"),
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Sayang barang datang terlambat.",
            rating: 2,
            sentiment: "negative",
            reviewDate: new Date("2025-10-12"),
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            productId: dummyProduct.id,
            reviewText: "Harga cukup mahal, tapi kualitas oke.",
            rating: 4,
            sentiment: "positive",
            reviewDate: new Date("2025-10-15"),
            createdAt: new Date(),
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

      // ── Notifikasi dummy ──────────────────────────────────────────────
      const dummyNotifications = [
        {
          title: "Selamat Datang di NusantaraInsight AI!",
          message: "Anda sekarang menggunakan mode Demo.",
          type: "info",
        },
        {
          title: "Produk Demo Berhasil Dibuat",
          message: `Produk "Semprotan Angin Air Gun Duster" telah ditambahkan.`,
          type: "success",
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

      const found = await tx.product.findUnique({ where: { id: productId } });
      if (!found) throw new Error("Produk tidak ditemukan");
      newProduct = found;
    });

    // ── Panggil FastAPI (async, jangan tunggu) ─────────────────────────────
    try {
      if (newProduct) {
        await fetch(`http://localhost:8000/generate-insight/${newProduct.id}`, {
          method: "GET",
        });
      }
    } catch {
      console.warn("FastAPI tidak dijangkau.");
    }

    // ── Kembalikan credentials untuk auto-login di client ────────────────
    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
      credentials: {
        email,
        password: "demo123",
      },
    });
  } catch (error) {
    console.error("❌ Gagal membuat demo sandbox:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
