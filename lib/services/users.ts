import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type UserWithRoleAndEstado = Prisma.UserGetPayload<{ include: { role: true; estado: true } }>;

// Da forma al objeto de usuario que se manda al cliente tras login/registro y
// desde /api/auth/me — única fuente de la regla "tenantId = id_user solo si
// el rol es tenant", antes duplicada en cada ruta de auth.
export function toSessionUser(dbUser: UserWithRoleAndEstado) {
  return {
    id: dbUser.id_user,
    email: dbUser.email,
    fullName: dbUser.full_name,
    nickname: dbUser.nickname,
    role: dbUser.role.name,
    tenantId: dbUser.role.name === "tenant" ? dbUser.id_user : null,
    notificationsEnabled: dbUser.notifications_enabled,
    status: dbUser.estado.name,
  };
}

// Lista todos los usuarios reales, usada para poblar selectores de "agregar
// jugador a la plantilla" con jugadores de verdad.
export async function listAllRealUsers() {
  const dbUsers = await prisma.user.findMany({
    include: { role: true },
    orderBy: { full_name: "asc" },
  });

  return dbUsers.map((dbUser) => ({
    id: dbUser.id_user,
    fullName: dbUser.full_name,
    nickname: dbUser.nickname,
    email: dbUser.email,
    role: dbUser.role.name,
    notificationsEnabled: dbUser.notifications_enabled,
  }));
}
