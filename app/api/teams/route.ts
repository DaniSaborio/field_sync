import { NextRequest, NextResponse } from "next/server";
import { listTeams, listUsers, sendConvocation, updateTeamRoster } from "@/lib/fieldsync-store";

export async function GET() {
  return NextResponse.json({ teams: listTeams(), users: listUsers() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? "roster");

    if (action === "roster") {
      const result = updateTeamRoster({
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
      const result = sendConvocation({
        teamId: Number(body?.teamId),
        scheduledAt: String(body?.scheduledAt ?? ""),
        courtName: String(body?.courtName ?? ""),
      });

      if (!result.ok) {
        return NextResponse.json(result, { status: 404 });
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