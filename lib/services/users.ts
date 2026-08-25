import { prisma } from "@/lib/prisma";

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
