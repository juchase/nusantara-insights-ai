import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth"; // Pastikan auth.ts sudah diperbaiki (email opsional)
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Product } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const demoUserId = crypto.randomUUID();
    const email = `demo_${demoUserId}@temp.nusantarainsight.ai`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 jam

    // 1. Cari produk template (ganti nama produk sesuai database Anda)
    const templateProduct = await prisma.product.findFirst({
      include: { reviews: true, sales: true },
      where: { name: { contains: "semprotan angin" } }, // Ganti sesuai produk dummy Anda
    });

    if (!templateProduct) {
      return NextResponse.json(
        { error: "Template produk demo tidak ditemukan." },
        { status: 500 },
      );
    }

    let newProduct: Product | undefined;

    const hashedPassword = await bcrypt.hash("demo123", 10);

    // 2. Transaksi atomik: buat user, clone produk, clone review, clone sales
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

      newProduct = await tx.product.create({
        data: {
          id: crypto.randomUUID(),
          userId: newUser.id,
          name: templateProduct.name,
          category: templateProduct.category,
        },
      });

      if (!newProduct) {
        throw new Error("Gagal membuat produk baru.");
      }

      if (templateProduct.reviews.length > 0) {
        const reviewData = templateProduct.reviews.map((review) => ({
          id: crypto.randomUUID(),
          productId: newProduct!.id,
          reviewText: review.reviewText,
          rating: review.rating,
          sentiment: review.sentiment,
          reviewDate: review.reviewDate,
          createdAt: new Date(),
        }));
        await tx.review.createMany({ data: reviewData });
      }

      if (templateProduct.sales.length > 0) {
        const salesData = templateProduct.sales.map((sale) => ({
          id: crypto.randomUUID(),
          productId: newProduct!.id,
          date: sale.date,
          quantity: sale.quantity,
          promotionFlag: sale.promotionFlag,
        }));
        await tx.sales.createMany({ data: salesData });
      }
    });

    // 3. Panggil AI Pipeline (jangan tunggu selesai, agar response cepat)
    try {
      if (!newProduct) {
        throw new Error(
          "Gagal membuat produk demo. Transaksi database tidak menghasilkan produk.",
        );
      }
      await fetch(`http://localhost:8000/generate-insight/${newProduct.id}`, {
        method: "GET", // Sesuaikan dengan endpoint FastAPI Anda
      });
    } catch (error) {
      console.warn(
        "⚠️ FastAPI tidak dijangkau. Insight akan di-generate nanti.",
      );
    }

    const token = signToken(
      {
        userId: demoUserId,
        role: "DEMO",
        isDemo: true,
        expiresAt: expiresAt.toISOString(),
      },
      "2h",
    );

    // ── SET COOKIE ──────────────────────────────────────────────────────────────
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
      maxAge: 2 * 60 * 60, // 2 jam dalam detik
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
