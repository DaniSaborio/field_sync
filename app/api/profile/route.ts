import { NextRequest, NextResponse } from "next/server";
import { getPlayerProfile, toggleNotifications, updateProfileVisibility } from "@/lib/fieldsync-store";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get("userId") ?? 0);

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId es obligatorio" }, { status: 400 });
  }

  const profile = getPlayerProfile(userId);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "No encontramos el perfil" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = Number(body?.userId);

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId es obligatorio" }, { status: 400 });
    }

    if (typeof body?.visibility === "string") {
      const result = updateProfileVisibility({
        userId,
        visibility: body.visibility === "private" ? "private" : "public",
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 404 });
      }

      return NextResponse.json(result);
    }

    if (typeof body?.notificationsEnabled === "boolean") {
      const result = toggleNotifications(userId, body.notificationsEnabled);
      if (!result.ok) {
        return NextResponse.json(result, { status: 404 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, error: "No hay cambios que aplicar" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos actualizar el perfil" },
      { status: 500 }
    );
  }
}