import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export function getUserFromRequest(request: NextRequest) {
  // Kita tidak bisa langsung memanggil getServerSession di sini karena butuh request,
  // tapi kita bisa menggunakan helper dari NextAuth.
  // Cara paling aman: di setiap API route, panggil getServerSession langsung.
  // Jadi fungsi ini sebenarnya tidak dipakai lagi.
  return null;
}
