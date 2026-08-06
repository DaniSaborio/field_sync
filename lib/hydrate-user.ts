import { prisma } from "@/lib/prisma";
import { upsertStoreUser, type UserRole } from "@/lib/fieldsync-store";

// Las plantillas/torneos/perfiles del store en memoria fueron sembrados con 4
// usuarios de demo bajo un mismo tenant ficticio (id 1). Cualquier jugador o
// admin de plataforma real que no pertenece a un tenant fijo se agrupa ahí
// también, solo para que las funciones existentes del store (que filtran por
// tenantId) sigan funcionando igual que con los usuarios de demo.
export const DEMO_TENANT_ID = 1;

export function mapPrismaRole(roleName: string): UserRole {
  if (roleName === "admin_plataforma") return "administrador";
  if (roleName === "tenant") return "organizador";
  return "jugador";
}

// Trae un usuario real de Prisma y lo sincroniza con el store en memoria si
// todavía no existe ahí. Sin esto, cualquier usuario fuera de la semilla de
// demo (registro nuevo o login con Google) es invisible para las funciones
// de equipos/torneos/perfil del store, que fallan con "no encontramos el
// jugador" aunque el usuario exista de verdad en la base.
export async function hydrateStoreUser(userId: number) {
  const dbUser = await prisma.user.findUnique({
    where: { id_user: userId },
    include: { role: true },
  });

  if (!dbUser) return null;

  return upsertStoreUser({
    id: dbUser.id_user,
    fullName: dbUser.full_name,
    email: dbUser.email,
    role: mapPrismaRole(dbUser.role.name),
    tenantId: DEMO_TENANT_ID,
    notificationsEnabled: dbUser.notifications_enabled,
  });
}

// Lista todos los usuarios reales (para poblar selectores de "agregar
// jugador a la plantilla" con jugadores de verdad, no solo la semilla).
export async function listAllRealUsers() {
  const dbUsers = await prisma.user.findMany({
    include: { role: true },
    orderBy: { full_name: "asc" },
  });

  return dbUsers.map((dbUser) => ({
    id: dbUser.id_user,
    fullName: dbUser.full_name,
    email: dbUser.email,
    role: mapPrismaRole(dbUser.role.name),
    tenantId: DEMO_TENANT_ID,
    notificationsEnabled: dbUser.notifications_enabled,
  }));
}
