/**
 * /api/teams — team/roster management, backed directly by Postgres.
 * GET:  list all teams plus every real user (for the "add to roster" picker).
 * POST: action-based — `action: "create"` makes a team with a captain,
 *       `"roster"` adds/removes a player, `"convocation"` notifies the roster
 *       about an upcoming match (captain-only, enforced in sendConvocation).
 */
import { NextRequest, NextResponse } from "next/server";
import { createTeam, listTeams, sendConvocation, updateTeamRoster } from "@/lib/services/teams";
import { listAllRealUsers } from "@/lib/services/users";

export async function GET() {
  const [teams, users] = await Promise.all([listTeams(), listAllRealUsers()]);
  return NextResponse.json({ teams, users });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? "roster");

    if (action === "create") {
      const result = await createTeam({
        tenantId: Number(body?.tenantId ?? 1),
        name: String(body?.name ?? ""),
        captainUserId: Number(body?.captainUserId),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 201 });
    }

    if (action === "roster") {
      const result = await updateTeamRoster({
        teamId: Number(body?.teamId),
        playerId: Number(body?.playerId),
        action: body?.rosterAction === "remove" ? "remove" : "add",
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 404 });
      }

      return NextResponse.json(result);
    }

    if (action === "convocation") {
      const result = await sendConvocation({
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
