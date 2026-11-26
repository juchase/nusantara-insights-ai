import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text;
    if (typeof text !== "string" || !text.trim() || text.length > 10000) {
      return NextResponse.json({ error: "Text harus berupa string 1-10000 karakter." }, { status: 400 });
    }

    const aiBaseUrl = process.env.AI_SERVICE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${aiBaseUrl.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: data?.detail || "AI service error" }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sentiment proxy failed:", error);
    return NextResponse.json({ error: "AI service tidak dapat dihubungi." }, { status: 502 });
  }
}
