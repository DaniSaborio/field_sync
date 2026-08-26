import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/jwt";

export const ADMIN_ROLES = ["administrador", "admin_plataforma"];

type AuthzResult =
  | { ok: true; userId: number; role: string }
  | { ok: false; status: 401 | 403; error: string };

// Identifica al usuario a partir del JWT firmado en la cookie de sesión (no de
// un id que mande el cliente en el body/query, que se puede falsificar) y
// revalida el rol contra la base de datos por si cambió — o el usuario fue
// suspendido/eliminado — desde que se emitió el token.
export async function requireAuth(request: NextRequest): Promise<AuthzResult> {
  const payload = getSessionPayload(request);
  if (!payload) {
    return { ok: false, status: 401, error: "Se requiere identificarse para hacer esto" };
  }

  const user = await prisma.user.findUnique({ where: { id_user: payload.userId }, include: { role: true } });
  if (!user) {
    return { ok: false, status: 401, error: "Se requiere identificarse para hacer esto" };
  }

  return { ok: true, userId: user.id_user, role: user.role.name };
}

export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<AuthzResult> {
  const authz = await requireAuth(request);
  if (!authz.ok) {
    return authz;
  }

  if (!allowedRoles.includes(authz.role)) {
    return { ok: false, status: 403, error: "No tenés permiso para hacer esto" };
  }

  return authz;
}
