/**
 * /api/profile — GET: returns a tenant-shaped profile (owned courts + booking
 * stats/revenue) or a player-shaped profile (stats/visibility/tournaments),
 * depending on the user's role. Both are read directly from Postgres.
 * PATCH: update visibility, nickname, or the notifications toggle for a user.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayerProfile, getTenantProfile, updateProfileVisibility } from "@/lib/services/profiles";

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

if (!dbUser) {
return NextResponse.json(
{ ok: false, error: "No encontramos el perfil" },
{ status: 404 }
);
}

if (dbUser.role.name === "tenant") {
  const profile = await getTenantProfile(userId);
  if (!profile) {
    return NextResponse.json(
      { ok: false, error: "No encontramos el perfil" },
      { status: 404 }
    );
  }
  return NextResponse.json({ kind: "tenant" as const, ...profile });
}

const profile = await getPlayerProfile(userId);

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
} catch (error) {
return NextResponse.json(
{
ok: false,
error:
error instanceof Error
? error.message
: "No pudimos obtener el perfil",
},
{ status: 500 }
);
}
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
  const result = await updateProfileVisibility({
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
}

if (typeof body?.notificationsEnabled === "boolean") {
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
