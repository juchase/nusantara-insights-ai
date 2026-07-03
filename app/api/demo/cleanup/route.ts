import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Cari user demo yang sudah kadaluarsa
    const expiredUsers = await prisma.user.findMany({
      where: {
        isDemo: true,
        expiresAt: { lte: now },
      },
    });

    console.log(
      `🧹 Menemukan ${expiredUsers.length} demo user yang kadaluarsa.`,
    );

    if (expiredUsers.length > 0) {
      const ids = expiredUsers.map((u) => u.id);

      // Hapus semua user berikut datanya sekaligus (Cascade via Prisma)
      await prisma.user.deleteMany({
        where: { id: { in: ids } },
      });

      console.log(
        `✅ Berhasil menghapus ${expiredUsers.length} demo user beserta datanya.`,
      );
    }

    return NextResponse.json({ deleted: expiredUsers.length });
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
