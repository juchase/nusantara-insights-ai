import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; // or your JWT library
import { prisma } from "@/lib/prisma";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // 1. If on auth pages (login/register) and token exists,
  //    check if user is still valid before redirecting.
  if (token && (pathname === "/login" || pathname === "/register")) {
    const user = await getUserFromToken(token);
    if (user) {
      // Valid user → redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      // Invalid/expired token or user deleted → clear cookie and let them stay
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
  }

  // 2. Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/dashboard") && token) {
    const user = await getUserFromToken(token);
    if (!user) {
      // User no longer exists → clear cookie and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}

// Helper to verify token and fetch user
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
      select: { id: true }, // only need existence
    });
    return user;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
