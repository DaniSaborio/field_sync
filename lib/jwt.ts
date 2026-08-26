/**
 * lib/jwt.ts — emisión/verificación del JWT de sesión y su cookie httpOnly.
 * La cookie (no el body/query de la request) es la única fuente de verdad
 * sobre quién es el usuario autenticado; ver lib/authz.ts para cómo se usa.
 */
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "fieldsync_session";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

export type SessionPayload = {
  userId: number;
  role: string;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado en las variables de entorno");
  }
  return secret;
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded !== "object" || decoded === null) return null;

    const { userId, role } = decoded as Record<string, unknown>;
    if (typeof userId !== "number" || typeof role !== "string") return null;

    return { userId, role };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionPayload(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
