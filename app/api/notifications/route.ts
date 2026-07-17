import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, message, type } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || "info",
        read: false,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Gagal membuat notifikasi:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// GET: Ambil notifikasi user (urutan terbaru)
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
    take: 20, // Batasi jumlah
  });

  return NextResponse.json({ data: notifications });
}

// PATCH: Tandai notifikasi sebagai sudah dibaca
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { notificationId } = body; // bisa juga array

  if (!notificationId) {
    // Tandai semua sebagai dibaca
    await prisma.notification.updateMany({
      where: { userId: user.userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  // Tandai satu notifikasi
  await prisma.notification.update({
    where: { id: notificationId, userId: user.userId },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Hapus semua notifikasi user ini
    await prisma.notification.deleteMany({
      where: { userId: user.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal menghapus semua notifikasi:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
