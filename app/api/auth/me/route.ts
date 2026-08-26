/**
 * /api/auth/me — GET: devuelve el usuario autenticado a partir del JWT de la
 * cookie de sesión. El frontend lo usa para rehidratar la sesión al cargar la
 * app en vez de confiar en un objeto guardado por el propio cliente.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";
import { toSessionUser } from "@/lib/services/users";

export async function GET(request: NextRequest) {
  const authz = await requireAuth(request);
  if (!authz.ok) {
    return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id_user: authz.userId },
    include: { role: true, estado: true },
  });

  if (!dbUser) {
    return NextResponse.json({ ok: false, error: "No encontramos el usuario" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user: toSessionUser(dbUser) });
}
