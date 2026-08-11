import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayerProfile, toggleNotifications, updateNickname, updateProfileVisibility } from "@/lib/fieldsync-store";
import { hydrateStoreUser } from "@/lib/hydrate-user";

export async function GET(request: NextRequest) {
const url = new URL(request.url);
const userId = Number(url.searchParams.get("userId") ?? 0);

if (!userId) {
return NextResponse.json(
{ ok: false, error: "userId es obligatorio" },
{ status: 400 }
);
}

try {
const dbUser = await prisma.user.findUnique({
where: { id_user: userId },
include: { role: true },
});

if (dbUser?.role.name === "tenant") {
  const courts = await prisma.court.findMany({
    where: { id_tenant: userId },
    include: {
      reservations: {
        include: {
          payments: {
            include: {
              estado: true,
            },
          },
        },
      },
    },
  });

  const ownedCourts = courts.map((court) => {
    const pendingCount = court.reservations.filter(
      (r) => r.status === "pendiente"
    ).length;

    const confirmedCount = court.reservations.filter(
      (r) => r.status === "confirmada"
    ).length;

    const verifiedRevenue = court.reservations
      .flatMap((r) => r.payments)
      .filter((p) => p.estado.name === "verificado")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      id: court.id_court,
      name: court.name,
      address: court.address,
      pricePerHour:
        court.price_per_hour !== null
          ? Number(court.price_per_hour)
          : null,
      rating:
        court.rating !== null ? Number(court.rating) : null,
      pendingCount,
      confirmedCount,
      verifiedRevenue,
    };
  });

  return NextResponse.json({
    kind: "tenant" as const,
    user: {
      id: dbUser.id_user,
      fullName: dbUser.full_name,
      nickname: dbUser.nickname,
      email: dbUser.email,
      role: dbUser.role.name,
      notificationsEnabled: dbUser.notifications_enabled,
    },
    courts: ownedCourts,
  });
}


} catch (dbError) {
console.warn(
"Prisma profile lookup failed, falling back to in-memory store:",
dbError
);
}

// Torneos/plantillas/perfil de jugador viven en el store en memoria, separado
// de Postgres: cualquier jugador que no sea de la semilla de demo (registro
// nuevo o login con Google) necesita sincronizarse acá primero o si no
// getPlayerProfile nunca lo va a encontrar.
await hydrateStoreUser(userId);

const profile = getPlayerProfile(userId);

if (!profile) {
return NextResponse.json(
{ ok: false, error: "No encontramos el perfil" },
{ status: 404 }
);
}

return NextResponse.json({
kind: "jugador" as const,
...profile,
});
}

export async function PATCH(request: NextRequest) {
try {
const body = await request.json();
const userId = Number(body?.userId);


if (!userId) {
  return NextResponse.json(
    { ok: false, error: "userId es obligatorio" },
    { status: 400 }
  );
}

if (typeof body?.visibility === "string") {
  const result = updateProfileVisibility({
    userId,
    visibility:
      body.visibility === "private" ? "private" : "public",
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}

if (
  typeof body?.nickname === "string" ||
  body?.nickname === null
) {
  const nickname =
    typeof body.nickname === "string" && body.nickname.trim()
      ? body.nickname.trim()
      : null;

  try {
    const updated = await prisma.user.update({
      where: { id_user: userId },
      data: { nickname },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id_user,
        nickname: updated.nickname,
      },
    });
  } catch (dbError) {
    console.warn(
      "Prisma nickname update failed, falling back to in-memory store:",
      dbError
    );
  }

  const result = updateNickname(userId, nickname);

  if (!result.ok) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}

if (typeof body?.notificationsEnabled === "boolean") {
  try {
    const updated = await prisma.user.update({
      where: { id_user: userId },
      data: {
        notifications_enabled: body.notificationsEnabled,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id_user,
        notificationsEnabled: updated.notifications_enabled,
      },
    });
  } catch (dbError) {
    console.warn(
      "Prisma notifications update failed, falling back to in-memory store:",
      dbError
    );
  }

  const result = toggleNotifications(
    userId,
    body.notificationsEnabled
  );

  if (!result.ok) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}

return NextResponse.json(
  { ok: false, error: "No hay cambios que aplicar" },
  { status: 400 }
);


} catch (error) {
return NextResponse.json(
{
ok: false,
error:
error instanceof Error
? error.message
: "No pudimos actualizar el perfil",
},
{ status: 500 }
);
}
}
