import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface TokenPayload {
  userId: string;
  email: string;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("token")?.value;
  return token || null;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret",
    ) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
