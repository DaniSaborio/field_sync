/**
 * /api/tournaments — tournament lifecycle, backed directly by Postgres.
 * GET:  full tournament snapshot (all tournaments, brackets/standings).
 * POST: action-based — `"create"` (round-robin or knockout), `"respond"`
 *       (approve/reject a court owner's tournament request), `"close"` to
 *       shut down the tournament (no more enrollments or fixture edits),
 *       `"enroll"` a team, `"start"` the bracket, `"setManualFixture"` for
 *       manual pairings, `"result"` to record a match result (goals/cards
 *       per player; may require a second admin confirmation).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authz";
import {
  closeTournament,
  createTournament,
  enrollTeamToTournament,
  getTournamentSnapshot,
  respondToTournamentRequest,
} from "@/lib/services/tournaments";
import { recordMatchResult, setManualFixture, startTournament } from "@/lib/services/matches";

export async function GET() {
  return NextResponse.json(await getTournamentSnapshot());
}

export async function POST(request: NextRequest) {
  try {
    const authz = await requireAuth(request);
    if (!authz.ok) {
      return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
    }

    const body = await request.json();
    const action = String(body?.action ?? "create");

    if (action === "create") {
      const result = await createTournament({
        createdByUserId: authz.userId,
        creatorRole: authz.role,
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
        responderId: authz.userId,
        responderRole: authz.role,
        action: body?.decision === "reject" ? "reject" : "approve",
        reason: typeof body?.reason === "string" ? body.reason : null,
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result);
    }

    if (action === "close") {
      const result = await closeTournament({
        tournamentId: Number(body?.tournamentId),
        responderId: authz.userId,
        responderRole: authz.role,
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