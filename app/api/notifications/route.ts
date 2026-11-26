import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const suppliedSecret = req.headers.get("x-internal-api-secret");
    const isTrustedInternalCall = Boolean(
      internalSecret && suppliedSecret && suppliedSecret === internalSecret,
    );

    let authenticatedUserId: string | undefined;
    if (!isTrustedInternalCall) {
      const session = await getServerSession(authOptions);
      authenticatedUserId = session?.user?.id;
      if (!authenticatedUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { title, message, type } = body ?? {};
    const userId = isTrustedInternalCall ? body?.userId : authenticatedUserId;
    const allowedTypes = new Set(["info", "success", "warning", "error"]);

    if (
      typeof userId !== "string" || !userId ||
      typeof title !== "string" || !title.trim() || title.length > 160 ||
      typeof message !== "string" || !message.trim() || message.length > 2000 ||
      (type !== undefined && !allowedTypes.has(type))
    ) {
      return NextResponse.json({ error: "Invalid notification payload" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title: title.trim(),
        message: message.trim(),
        type: type || "info",
        read: false,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat notifikasi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET: Ambil notifikasi user (urutan terbaru)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20, // Batasi jumlah
  });

  return NextResponse.json({ data: notifications });
}

// PATCH: Tandai notifikasi sebagai sudah dibaca
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { notificationId } = body; // bisa juga array

  if (!notificationId) {
    // Tandai semua sebagai dibaca
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  // Tandai satu notifikasi
  await prisma.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Hapus semua notifikasi user ini
    await prisma.notification.deleteMany({
      where: { userId: session.user.id },
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
