import { NextRequest, NextResponse } from "next/server";
import { createTeam, listTeams, sendConvocation, updateTeamRoster } from "@/lib/fieldsync-store";
import { hydrateStoreUser, listAllRealUsers } from "@/lib/hydrate-user";

export async function GET() {
  // La lista de jugadores para "agregar a la plantilla" tiene que salir de
  // Postgres (todos los usuarios reales), no del store en memoria (que solo
  // conoce a los 4 usuarios de la semilla de demo).
  const users = await listAllRealUsers();
  return NextResponse.json({ teams: listTeams(), users });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? "roster");

    if (action === "create") {
      const captainUserId = Number(body?.captainUserId);
      await hydrateStoreUser(captainUserId);

      const result = createTeam({
        tenantId: Number(body?.tenantId ?? 1),
        name: String(body?.name ?? ""),
        captainUserId,
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 201 });
    }

    if (action === "roster") {
      const playerId = Number(body?.playerId);
      if (body?.rosterAction !== "remove") {
        await hydrateStoreUser(playerId);
      }

      const result = updateTeamRoster({
        teamId: Number(body?.teamId),
        playerId,
        action: body?.rosterAction === "remove" ? "remove" : "add",
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 404 });
      }

      return NextResponse.json(result);
    }

    if (action === "convocation") {
      const result = sendConvocation({
        teamId: Number(body?.teamId),
        senderUserId: Number(body?.userId),
        scheduledAt: String(body?.scheduledAt ?? ""),
        courtName: String(body?.courtName ?? ""),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 403 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, error: "Acción no soportada" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos actualizar el equipo" },
      { status: 500 }
    );
  }
}