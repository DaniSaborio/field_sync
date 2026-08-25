/**
 * /api/tournaments — tournament lifecycle (data lives in the in-memory store).
 * GET:  full tournament snapshot (all tournaments, brackets/standings).
 * POST: action-based — `"create"` (round-robin or knockout), `"respond"`
 *       (approve/reject a court owner's tournament request), `"enroll"` a
 *       team, `"start"` the bracket, `"setManualFixture"` for manual
 *       pairings, `"result"` to record a match result (goals/cards per
 *       player; may require a second admin confirmation).
 */
import { NextRequest, NextResponse } from "next/server";
import {
  createTournament,
  ensureTeamsHydrated,
  ensureTournamentsHydrated,
  enrollTeamToTournament,
  getTournamentSnapshot,
  recordMatchResult,
  respondToTournamentRequest,
  setManualFixture,
  startTournament,
} from "@/lib/fieldsync-store";

export async function GET() {
  await Promise.all([ensureTeamsHydrated(), ensureTournamentsHydrated()]);
  return NextResponse.json(getTournamentSnapshot());
}

export async function POST(request: NextRequest) {
  try {
    await Promise.all([ensureTeamsHydrated(), ensureTournamentsHydrated()]);
    const body = await request.json();
    const action = String(body?.action ?? "create");

    if (action === "create") {
      const result = await createTournament({
        createdByUserId: Number(body?.userId ?? 0),
        creatorRole: typeof body?.role === "string" ? body.role : undefined,
        courtId: Number(body?.courtId ?? 0),
        name: String(body?.name ?? ""),
        format: body?.format === "eliminatorio" ? "eliminatorio" : "todos-contra-todos",
        fixtureMode: body?.fixtureMode === "manual" ? "manual" : "aleatorio",
        teamIds: Array.isArray(body?.teamIds) ? body.teamIds.map((id: unknown) => Number(id)) : [],
        startDate: String(body?.startDate ?? ""),
        endDate: String(body?.endDate ?? ""),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 201 });
    }

    if (action === "respond") {
      const result = await respondToTournamentRequest({
        tournamentId: Number(body?.tournamentId),
        responderId: Number(body?.userId),
        responderRole: typeof body?.role === "string" ? body.role : undefined,
        action: body?.decision === "reject" ? "reject" : "approve",
        reason: typeof body?.reason === "string" ? body.reason : null,
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result);
    }

    if (action === "enroll") {
      const result = await enrollTeamToTournament({
        tournamentId: Number(body?.tournamentId),
        teamId: Number(body?.teamId),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 404 });
      }

      return NextResponse.json(result);
    }

    if (action === "start") {
      const result = await startTournament({
        tournamentId: Number(body?.tournamentId),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 409 });
      }

      return NextResponse.json(result);
    }

    if (action === "setManualFixture") {
      const pairs = Array.isArray(body?.pairs)
        ? body.pairs.map((pair: unknown) => ({
            homeTeamId: Number((pair as { homeTeamId?: unknown })?.homeTeamId),
            awayTeamId: Number((pair as { awayTeamId?: unknown })?.awayTeamId),
          }))
        : [];

      const result = await setManualFixture({
        tournamentId: Number(body?.tournamentId),
        pairs,
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 409 });
      }

      return NextResponse.json(result);
    }

    if (action === "result") {
      const stats = Array.isArray(body?.stats)
        ? body.stats.map((stat: unknown) => {
            const record = stat as {
              playerId?: unknown;
              teamId?: unknown;
              goals?: unknown;
              yellowCards?: unknown;
              redCards?: unknown;
            };
            return {
              playerId: Number(record?.playerId),
              teamId: Number(record?.teamId),
              goals: Number(record?.goals ?? 0),
              yellowCards: Number(record?.yellowCards ?? 0),
              redCards: Number(record?.redCards ?? 0),
            };
          })
        : [];

      const result = await recordMatchResult({
        matchId: Number(body?.matchId),
        stats,
        confirmedByAdmin: Boolean(body?.confirmedByAdmin),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: result.requiresSecondAuthorization ? 409 : 400 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, error: "Acción no soportada" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos procesar el torneo" },
      { status: 500 }
    );
  }
}