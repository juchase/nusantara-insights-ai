import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { avatar } = body;

    if (!avatar) {
      return NextResponse.json({ error: "Avatar required" }, { status: 400 });
    }

    // Update avatar di database
    await prisma.user.update({
      where: { id: user.userId },
      data: { avatar },
    });

    // Kembalikan avatar yang baru disimpan
    return NextResponse.json({ success: true, avatar });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.userId },
    data: { avatar: null },
  });

  // Hapus dari localStorage (dilakukan di frontend, tapi bisa juga respons)
  return NextResponse.json({ success: true });
}
