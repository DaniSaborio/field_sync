import { prisma } from "@/lib/prisma";

export const ADMIN_ROLES = ["administrador", "admin_plataforma"];

type AuthzResult =
  | { ok: true; userId: number; role: string }
  | { ok: false; status: 401 | 403; error: string };

// Verifica el rol real del usuario contra la base de datos en vez de confiar
// en un string de rol que manda el propio cliente — eso se puede falsificar
// mandando cualquier valor en el body/query de la request.
export async function requireRole(userId: unknown, allowedRoles: string[]): Promise<AuthzResult> {
  const id = Number(userId);
  if (!id) {
    return { ok: false, status: 401, error: "Se requiere identificarse para hacer esto" };
  }

  const user = await prisma.user.findUnique({ where: { id_user: id }, include: { role: true } });
  if (!user || !allowedRoles.includes(user.role.name)) {
    return { ok: false, status: 403, error: "No tenés permiso para hacer esto" };
  }

  return { ok: true, userId: id, role: user.role.name };
}
