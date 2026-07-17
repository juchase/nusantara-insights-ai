import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Contoh: hapus semua refresh token atau session
  // Jika Anda menggunakan JWT dan tidak ada session di DB, Anda bisa memaksa user ganti password atau gunakan blacklist.
  // Implementasi sederhana: hapus cookie dan redirect.
  const response = NextResponse.json({ success: true });
  response.cookies.delete("token");
  return response;
}
