/**
 * /api/auth/logout — POST: borra la cookie de sesión.
 */
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/jwt";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
