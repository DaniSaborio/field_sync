import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeamById } from "@/lib/fieldsync-store";

function teamOrNull(teamId: number | null) {
  if (!teamId) return null;
  return getTeamById(teamId);
}

async function buildChecklist(reservationId: number) {
  const reservation = await prisma.reservation.findUnique({
    where: { id_reservation: reservationId },
    include: { court: true, payments: true, match_closed_by: true },
  });

  if (!reservation) {
    return { ok: false as const, error: "No encontramos la reserva", status: 404 };
  }

  if (!reservation.id_team || !reservation.id_rival_team) {
    return { ok: false as const, error: "Esta reserva no tiene una plantilla rival asignada", status: 400 };
  }

  if (reservation.status !== "confirmada") {
    return { ok: false as const, error: "El partido todavía no está confirmado", status: 409 };
  }

  const homeTeam = teamOrNull(reservation.id_team);
  const rivalTeam = teamOrNull(reservation.id_rival_team);

  if (!homeTeam || !rivalTeam) {
    return { ok: false as const, error: "No encontramos alguna de las plantillas de este partido", status: 404 };
  }

  const allPlayerIds = Array.from(new Set([...homeTeam.playerIds, ...rivalTeam.playerIds]));
  const [users, checks] = await Promise.all([
    prisma.user.findMany({ where: { id_user: { in: allPlayerIds } } }),
    prisma.matchPaymentCheck.findMany({ where: { id_reservation: reservationId } }),
  ]);

  const userById = new Map(users.map((user) => [user.id_user, user]));
  const paidByPlayerId = new Map(checks.map((check) => [check.id_player, check]));
  const amount = reservation.payments[0] ? Number(reservation.payments[0].amount) : null;

  function playersFor(team: NonNullable<ReturnType<typeof teamOrNull>>, teamId: number) {
    return team.playerIds.map((playerId) => {
      const user = userById.get(playerId);
      const check = paidByPlayerId.get(playerId);
      return {
        id: playerId,
        name: user ? user.nickname || user.full_name : `Jugador #${playerId}`,
        teamId,
        paid: check?.paid ?? false,
        paidAt: check?.paid_at?.toISOString() ?? null,
      };
    });
  }

  const homePlayers = playersFor(homeTeam, homeTeam.id);
  const rivalPlayers = playersFor(rivalTeam, rivalTeam.id);
  const allPlayers = [...homePlayers, ...rivalPlayers];
  const perPersonAmount = amount != null && allPlayers.length > 0 ? Math.round(amount / allPlayers.length) : null;

  return {
    ok: true as const,
    checklist: {
      reservationId,
      courtName: reservation.court.name,
      date: reservation.date.toISOString().slice(0, 10),
      timeSlot: `${reservation.start_time.getUTCHours().toString().padStart(2, "0")}:${reservation.start_time.getUTCMinutes().toString().padStart(2, "0")}`,
      amount,
      perPersonAmount,
      homeTeam: { id: homeTeam.id, name: homeTeam.name, players: homePlayers },
      rivalTeam: { id: rivalTeam.id, name: rivalTeam.name, players: rivalPlayers },
      allPaid: allPlayers.length > 0 && allPlayers.every((player) => player.paid),
      closed: reservation.match_closed_at != null,
      closedAt: reservation.match_closed_at?.toISOString() ?? null,
      closedByName: reservation.match_closed_by
        ? reservation.match_closed_by.nickname || reservation.match_closed_by.full_name
        : null,
      canManage: {
        bookerUserId: reservation.id_user,
        tenantUserId: reservation.court.id_tenant,
        homeCaptainUserId: homeTeam.captainUserId,
        rivalCaptainUserId: rivalTeam.captainUserId,
      },
    },
  };
}

type ChecklistCanManage = {
  bookerUserId: number;
  tenantUserId: number;
  homeCaptainUserId: number;
  rivalCaptainUserId: number;
};

function isAllowedToManageMatch(canManage: ChecklistCanManage, actingUserId: number) {
  return (
    actingUserId === canManage.bookerUserId ||
    actingUserId === canManage.tenantUserId ||
    actingUserId === canManage.homeCaptainUserId ||
    actingUserId === canManage.rivalCaptainUserId
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const reservationId = Number(url.searchParams.get("reservationId") ?? 0);

  if (!reservationId) {
    return NextResponse.json({ ok: false, error: "reservationId es obligatorio" }, { status: 400 });
  }

  try {
    const result = await buildChecklist(reservationId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, checklist: result.checklist });
  } catch (error) {
    console.error("Match payment checklist lookup failed:", error);
    return NextResponse.json(
      { ok: false, error: "No pudimos cargar el checklist de pagos" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const reservationId = Number(body?.reservationId);
    const playerId = Number(body?.playerId);
    const paid = Boolean(body?.paid);
    const actingUserId = Number(body?.actingUserId);

    if (!reservationId || !playerId || !actingUserId) {
      return NextResponse.json({ ok: false, error: "Faltan datos para actualizar el checklist" }, { status: 400 });
    }

    const result = await buildChecklist(reservationId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    const { canManage, homeTeam, rivalTeam } = result.checklist;

    if (!isAllowedToManageMatch(canManage, actingUserId)) {
      return NextResponse.json(
        { ok: false, error: "No tenés permiso para verificar los pagos de este partido" },
        { status: 403 },
      );
    }

    if (result.checklist.closed) {
      return NextResponse.json(
        { ok: false, error: "Este partido ya está cerrado, no se puede editar el checklist" },
        { status: 409 },
      );
    }

    const playerTeamId = homeTeam.players.some((player) => player.id === playerId)
      ? homeTeam.id
      : rivalTeam.players.some((player) => player.id === playerId)
        ? rivalTeam.id
        : null;

    if (!playerTeamId) {
      return NextResponse.json(
        { ok: false, error: "Ese jugador no pertenece a ninguna de las dos plantillas" },
        { status: 400 },
      );
    }

    await prisma.matchPaymentCheck.upsert({
      where: { id_reservation_id_player: { id_reservation: reservationId, id_player: playerId } },
      create: {
        id_reservation: reservationId,
        id_player: playerId,
        id_team: playerTeamId,
        paid,
        paid_at: paid ? new Date() : null,
        id_checked_by: actingUserId,
      },
      update: {
        paid,
        paid_at: paid ? new Date() : null,
        id_checked_by: actingUserId,
      },
    });

    const updated = await buildChecklist(reservationId);
    if (!updated.ok) {
      return NextResponse.json({ ok: false, error: updated.error }, { status: updated.status });
    }

    return NextResponse.json({ ok: true, checklist: updated.checklist });
  } catch (error) {
    console.error("Match payment checklist update failed:", error);
    return NextResponse.json(
      { ok: false, error: "No pudimos actualizar el checklist de pagos" },
      { status: 500 },
    );
  }
}

// Cierra formalmente el pago del partido: requiere que alguien con permiso lo
// confirme a propósito, no basta con que el checklist quede todo en true.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reservationId = Number(body?.reservationId);
    const actingUserId = Number(body?.actingUserId);

    if (!reservationId || !actingUserId) {
      return NextResponse.json({ ok: false, error: "Faltan datos para cerrar el partido" }, { status: 400 });
    }

    const result = await buildChecklist(reservationId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    const { canManage } = result.checklist;

    if (!isAllowedToManageMatch(canManage, actingUserId)) {
      return NextResponse.json(
        { ok: false, error: "No tenés permiso para cerrar el pago de este partido" },
        { status: 403 },
      );
    }

    if (result.checklist.closed) {
      return NextResponse.json({ ok: false, error: "Este partido ya está cerrado" }, { status: 409 });
    }

    if (!result.checklist.allPaid) {
      return NextResponse.json(
        { ok: false, error: "Todavía hay jugadores sin marcar como pagados" },
        { status: 409 },
      );
    }

    await prisma.reservation.update({
      where: { id_reservation: reservationId },
      data: { match_closed_at: new Date(), id_match_closed_by: actingUserId },
    });

    const notifyUserIds = Array.from(
      new Set([canManage.homeCaptainUserId, canManage.rivalCaptainUserId, canManage.bookerUserId]),
    );
    await Promise.all(
      notifyUserIds.map((userId) =>
        prisma.notification.create({
          data: {
            id_user: userId,
            type: "reservation",
            message: `Pago cerrado: ${result.checklist.homeTeam.name} vs ${result.checklist.rivalTeam.name} en ${result.checklist.courtName} el ${result.checklist.date} a las ${result.checklist.timeSlot}. Todos los jugadores quedaron al día.`,
          },
        }),
      ),
    );

    const updated = await buildChecklist(reservationId);
    if (!updated.ok) {
      return NextResponse.json({ ok: false, error: updated.error }, { status: updated.status });
    }

    return NextResponse.json({ ok: true, checklist: updated.checklist });
  } catch (error) {
    console.error("Match payment close failed:", error);
    return NextResponse.json(
      { ok: false, error: "No pudimos cerrar el pago del partido" },
      { status: 500 },
    );
  }
}
