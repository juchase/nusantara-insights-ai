import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Helper untuk membersihkan cookie dan redirect
  const clearAndRedirect = (url: string) => {
    const response = NextResponse.redirect(new URL(url, request.url));
    response.cookies.delete("token");
    return response;
  };

  // 1. Jika berada di halaman auth (login/register) dan sudah punya token
  if (token && (pathname === "/login" || pathname === "/register")) {
    const user = await getUserFromToken(token);
    if (user) {
      // Valid user → redirect ke dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      // Token invalid atau user sudah dihapus → hapus cookie dan biarkan tetap di halaman login
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
  }

  // 2. Proteksi halaman dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verifikasi token dan cek apakah user masih valid
    const user = await getUserFromToken(token);
    if (!user) {
      return clearAndRedirect("/login");
    }

    // ── TAMBAHAN: Cek apakah user demo sudah expired ──
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      const isDemo = payload.isDemo === true;
      const expiresAt = payload.expiresAt
        ? new Date(payload.expiresAt as string)
        : null;

      // Jika user demo dan sudah lewat waktu, logout paksa
      if (isDemo && expiresAt && new Date() > expiresAt) {
        // Hapus cookie dan arahkan ke home
        return clearAndRedirect("/");
      }
    } catch {
      // Jika gagal verifikasi token, biarkan flow normal (akan redirect ke login)
    }
  }

  return NextResponse.next();
}

// Helper untuk memverifikasi token dan mengambil user dari database
async function getUserFromToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId || payload.sub;
    if (typeof userId !== "string") {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }, // hanya perlu keberadaan
    });
    return user;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
