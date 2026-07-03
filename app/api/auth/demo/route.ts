import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST() {
  const demoUser = await prisma.user.findUnique({
    where: {
      email: "demo@nusantarainsight.ai",
    },
  });

  if (!demoUser) {
    return NextResponse.json(
      { message: "Demo user not found" },
      { status: 404 },
    );
  }

  const token = jwt.sign(
    {
      id: demoUser.id,
      role: demoUser.role,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "15m",
    },
  );

  return NextResponse.json({
    token,
    user: demoUser,
  });
}
