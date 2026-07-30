import { NextRequest, NextResponse } from "next/server";
import {
  createTournament,
  enrollTeamToTournament,
  getTournamentSnapshot,
  recordMatchResult,
  startTournament,
} from "@/lib/fieldsync-store";

export async function GET() {
  return NextResponse.json(getTournamentSnapshot());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? "create");

    if (action === "create") {
      const result = createTournament({
        tenantId: Number(body?.tenantId ?? 1),
        createdByUserId: Number(body?.userId ?? 0),
        courtId: Number(body?.courtId ?? 0),
        name: String(body?.name ?? ""),
        format: body?.format === "eliminatorio" ? "eliminatorio" : "todos-contra-todos",
        teamIds: Array.isArray(body?.teamIds) ? body.teamIds.map((id: unknown) => Number(id)) : [],
        startDate: String(body?.startDate ?? ""),
        endDate: String(body?.endDate ?? ""),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 201 });
    }

    if (action === "enroll") {
      const result = enrollTeamToTournament({
        tournamentId: Number(body?.tournamentId),
        teamId: Number(body?.teamId),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 404 });
      }

      return NextResponse.json(result);
    }

    if (action === "start") {
      const result = startTournament({
        tournamentId: Number(body?.tournamentId),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 409 });
      }

      return NextResponse.json(result);
    }

    if (action === "result") {
      const result = recordMatchResult({
        matchId: Number(body?.matchId),
        homeGoals: Number(body?.homeGoals),
        awayGoals: Number(body?.awayGoals),
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