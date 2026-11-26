import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@nusantarainsight.ai" },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    if (!demoUser) {
      return NextResponse.json({ message: "Demo user not found" }, { status: 404 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET belum dikonfigurasi.");
      return NextResponse.json({ error: "Authentication is not configured" }, { status: 500 });
    }

    const token = jwt.sign({ id: demoUser.id, role: demoUser.role }, secret, { expiresIn: "15m" });
    return NextResponse.json({ token, user: demoUser });
  } catch (error) {
    console.error("Demo login gagal:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
