import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await context.params;
  const frequency = request.nextUrl.searchParams.get("frequency") ?? "D";

  if (frequency !== "D" && frequency !== "W") {
    return NextResponse.json(
      { error: "frequency harus D atau W" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, userId: session.user.id },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  try {
    const response = await fetch(
      `${AI_SERVICE_URL}/forecast/v2/${encodeURIComponent(productId)}?frequency=${frequency}`,
      { method: "POST", cache: "no-store" },
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload?.detail || payload?.error || "Forecasting V2 gagal",
          detail: payload,
        },
        { status: response.status === 422 ? 422 : 502 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Forecasting V2 service unavailable:", error);
    return NextResponse.json(
      { error: "AI service tidak dapat dijangkau" },
      { status: 503 },
    );
  }
}
