/**
 * /api/teams — team/roster management (data lives in the in-memory store,
 * except the user directory which is read from Postgres).
 * GET:  list all teams plus every real user (for the "add to roster" picker).
 * POST: action-based — `action: "create"` makes a team with a captain,
 *       `"roster"` adds/removes a player, `"convocation"` notifies the roster
 *       about an upcoming match (captain-only, enforced in sendConvocation).
 */
import { NextRequest, NextResponse } from "next/server";
import { createTeam, ensureTeamsHydrated, listTeams, sendConvocation, updateTeamRoster } from "@/lib/fieldsync-store";
import { hydrateStoreUser, listAllRealUsers } from "@/lib/hydrate-user";

export async function GET() {
  // The player list for "add to roster" has to come from Postgres (all real
  // users), not from the in-memory store (which only knows the 4 seeded
  // demo users).
  const [users] = await Promise.all([listAllRealUsers(), ensureTeamsHydrated()]);
  return NextResponse.json({ teams: listTeams(), users });
}

export async function POST(request: NextRequest) {
  try {
    await ensureTeamsHydrated();
    const body = await request.json();
    const action = String(body?.action ?? "roster");

    if (action === "create") {
      const captainUserId = Number(body?.captainUserId);
      await hydrateStoreUser(captainUserId);

      const result = await createTeam({
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

      const result = await updateTeamRoster({
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