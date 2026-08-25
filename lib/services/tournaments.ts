import { prisma } from "@/lib/prisma";
import { notifyPush } from "@/lib/notify";
import { findSharedPlayerConflict } from "@/lib/services/teams";

// Torneos creados por el dueño de la cancha o un admin de plataforma quedan
// aprobados al instante; cualquier otro rol (jugador, capitán) solo puede
// *solicitar* un torneo, que queda "pendiente" hasta que el dueño lo revise.
const AUTO_APPROVE_ROLES = ["admin_plataforma", "tenant"];

async function notifyTournamentTenant(tenantId: number, message: string) {
  const owner = await prisma.user.findUnique({ where: { id_user: tenantId } });
  if (!owner || !owner.notifications_enabled) return;
  await prisma.notification.create({ data: { id_user: owner.id_user, type: "tournament", message } });
  notifyPush(owner.id_user, message);
}

export async function createTournament(input: {
  createdByUserId: number;
  creatorRole?: string;
  tenantId?: number;
  courtId: number;
  name: string;
  format: "eliminatorio" | "todos-contra-todos";
  fixtureMode?: "aleatorio" | "manual";
  teamIds: number[];
  startDate: string;
  endDate: string;
}) {
  if (!input.name.trim()) {
    return { ok: false as const, error: "El nombre del torneo es obligatorio" };
  }

  const creatorRole =
    input.creatorRole ??
    (input.tenantId
      ? "tenant"
      : (await prisma.user.findUnique({ where: { id_user: input.createdByUserId }, include: { role: true } }))?.role
          .name);

  if (!creatorRole) {
    return { ok: false as const, error: "No pudimos identificar tu rol de usuario" };
  }

  const court = await prisma.court.findUnique({ where: { id_court: input.courtId } });
  if (!court) {
    return { ok: false as const, error: "Selecciona una cancha válida para el torneo" };
  }

  const teamIds = Array.from(new Set(input.teamIds));
  if (teamIds.length < 2) {
    return { ok: false as const, error: "Selecciona al menos dos equipos participantes" };
  }

  const existingTeams = await prisma.team.findMany({ where: { id_team: { in: teamIds } }, select: { id_team: true } });
  const existingIds = new Set(existingTeams.map((t) => t.id_team));
  const unknownTeamId = teamIds.find((teamId) => !existingIds.has(teamId));
  if (unknownTeamId !== undefined) {
    return { ok: false as const, error: `No encontramos el equipo #${unknownTeamId}` };
  }

  const conflict = await findSharedPlayerConflict(teamIds);
  if (conflict) {
    return {
      ok: false as const,
      error: `${conflict.teamA.name} y ${conflict.teamB.name} comparten jugadores: no pueden estar en el mismo torneo`,
    };
  }

  const autoApproved = AUTO_APPROVE_ROLES.includes(creatorRole);
  const fixtureMode = input.fixtureMode === "manual" ? "manual" : "aleatorio";
  const estado = await prisma.estado.findUniqueOrThrow({ where: { name: autoApproved ? "aprobado" : "pendiente" } });

  // Los horarios de inicio/fin de partido no los captura ningún formulario
  // hoy (solo se pide la fecha) — se fija una hora por defecto, ya que
  // Tournament.start_time/end_time no se leen en ningún lado de la app.
  const startDateTime = new Date(`${input.startDate}T19:00:00.000Z`);
  const endDateTime = new Date(`${input.endDate}T22:00:00.000Z`);

  const dbTournament = await prisma.tournament.create({
    data: {
      id_tenant: court.id_tenant,
      id_court: court.id_court,
      id_requested_by: input.createdByUserId,
      name: input.name.trim(),
      format: input.format,
      fixture_mode: fixtureMode,
      min_teams: teamIds.length,
      start_date: new Date(`${input.startDate}T00:00:00.000Z`),
      end_date: new Date(`${input.endDate}T00:00:00.000Z`),
      start_time: startDateTime,
      end_time: endDateTime,
      id_estado: estado.id_estado,
      id_approved_by: autoApproved ? input.createdByUserId : null,
      approved_at: autoApproved ? new Date() : null,
      team_tournaments: { create: teamIds.map((id_team) => ({ id_team })) },
    },
  });

  if (!autoApproved) {
    const requester = await prisma.user.findUnique({ where: { id_user: input.createdByUserId } });
    await notifyTournamentTenant(
      court.id_tenant,
      `${requester?.full_name ?? "Un jugador"} solicitó el torneo "${dbTournament.name}" en ${court.name}. Revisalo para aprobarlo o rechazarlo.`,
    );
  }

  return { ok: true as const, tournamentId: dbTournament.id_tournament };
}

// El dueño de la cancha (o un admin de plataforma) aprueba o rechaza una
// solicitud de torneo pendiente, y se notifica a quien la pidió.
export async function respondToTournamentRequest(input: {
  tournamentId: number;
  responderId: number;
  responderRole?: string;
  action: "approve" | "reject";
  reason?: string | null;
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id_tournament: input.tournamentId },
    include: { estado: true },
  });
  if (!tournament) {
    return { ok: false as const, error: "No encontramos el torneo" };
  }

  if (tournament.estado.name !== "pendiente") {
    return { ok: false as const, error: "Esta solicitud ya fue procesada" };
  }

  const isPlatformAdmin = input.responderRole === "admin_plataforma";
  if (!isPlatformAdmin && tournament.id_tenant !== input.responderId) {
    return { ok: false as const, error: "Este torneo no pertenece a una de tus canchas" };
  }

  if (input.action === "reject" && !input.reason) {
    return { ok: false as const, error: "Indica el motivo del rechazo" };
  }

  const estado = await prisma.estado.findUniqueOrThrow({
    where: { name: input.action === "approve" ? "aprobado" : "rechazado" },
  });
  await prisma.tournament.update({
    where: { id_tournament: tournament.id_tournament },
    data: {
      id_estado: estado.id_estado,
      rejection_reason: input.action === "reject" ? input.reason ?? null : null,
      id_approved_by: input.action === "approve" ? input.responderId : null,
      approved_at: input.action === "approve" ? new Date() : null,
    },
  });

  const requester = await prisma.user.findUnique({ where: { id_user: tournament.id_requested_by } });
  if (requester?.notifications_enabled) {
    const message =
      input.action === "approve"
        ? `¡Tu solicitud de torneo "${tournament.name}" fue aprobada! Ya podés inscribir equipos y comenzarlo.`
        : `Tu solicitud de torneo "${tournament.name}" fue rechazada: ${input.reason}.`;
    await prisma.notification.create({ data: { id_user: requester.id_user, type: "tournament", message } });
    notifyPush(requester.id_user, message);
  }

  return { ok: true as const };
}

export async function enrollTeamToTournament(input: { tournamentId: number; teamId: number }) {
  const [tournament, team] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id_tournament: input.tournamentId },
      include: { estado: true, team_tournaments: true },
    }),
    prisma.team.findUnique({ where: { id_team: input.teamId } }),
  ]);

  if (!tournament || !team) {
    return { ok: false as const, error: "No encontramos el torneo o el equipo" };
  }

  if (tournament.estado.name !== "aprobado") {
    return { ok: false as const, error: "El torneo aún no ha sido aprobado por el dueño de la cancha" };
  }

  const alreadyEnrolled = tournament.team_tournaments.some((tt) => tt.id_team === team.id_team);
  if (!alreadyEnrolled) {
    const currentTeamIds = tournament.team_tournaments.map((tt) => tt.id_team);
    const conflict = await findSharedPlayerConflict([...currentTeamIds, team.id_team]);
    if (conflict) {
      const otherTeam = conflict.teamA.id === team.id_team ? conflict.teamB : conflict.teamA;
      return {
        ok: false as const,
        error: `${team.name} comparte jugadores con ${otherTeam.name}: no pueden estar en el mismo torneo`,
      };
    }

    await prisma.teamTournament.upsert({
      where: { id_team_id_tournament: { id_team: team.id_team, id_tournament: tournament.id_tournament } },
      update: {},
      create: { id_team: team.id_team, id_tournament: tournament.id_tournament },
    });
  }

  return { ok: true as const };
}

export async function getTournaments() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      estado: true,
      team_tournaments: true,
      matches: {
        include: { match_stats: { include: { player_profile: { select: { id_user: true } } } } },
        orderBy: { id_match: "asc" },
      },
      standings: true,
    },
    orderBy: { id_tournament: "asc" },
  });

  return tournaments.map((tournament) => ({
    id: tournament.id_tournament,
    tenantId: tournament.id_tenant,
    createdByUserId: tournament.id_requested_by,
    courtId: tournament.id_court,
    name: tournament.name,
    format: tournament.format,
    fixtureMode: tournament.fixture_mode as "aleatorio" | "manual",
    teamsRequired: tournament.min_teams,
    startDate: tournament.start_date.toISOString().slice(0, 10),
    endDate: tournament.end_date.toISOString().slice(0, 10),
    status: (tournament.matches.length > 0 ? "active" : "draft") as "draft" | "active",
    requestStatus: tournament.estado.name as "pendiente" | "aprobado" | "rechazado",
    rejectionReason: tournament.rejection_reason,
    teamIds: tournament.team_tournaments.map((tt) => tt.id_team),
    fixture: tournament.matches.map((match) => ({
      id: match.id_match,
      tournamentId: tournament.id_tournament,
      homeTeamId: match.id_home_team,
      awayTeamId: match.id_away_team,
      scheduledAt: match.scheduled_at.toISOString(),
      homeGoals: match.home_goals,
      awayGoals: match.away_goals,
      status: match.status as "scheduled" | "confirmed",
      resultLocked: match.result_locked,
      auditTrail: match.audit_trail,
      round: match.round,
      stats: match.match_stats.map((stat) => ({
        id: stat.id_match_stat,
        matchId: stat.id_match,
        playerId: stat.player_profile.id_user,
        teamId: stat.id_team,
        goals: stat.goals,
        yellowCards: stat.yellow_cards,
        redCards: stat.red_cards,
      })),
    })),
    standings: tournament.standings.map((standing) => ({
      teamId: standing.id_team,
      tournamentId: standing.id_tournament,
      played: standing.matches_played,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      goalsFor: standing.goals_for,
      goalsAgainst: standing.goals_against,
      points: standing.points,
    })),
  }));
}

export async function getTournamentSnapshot() {
  const tournaments = await getTournaments();
  return {
    tournaments,
    matches: tournaments.flatMap((t) => t.fixture),
    standings: tournaments.flatMap((t) => t.standings),
  };
}
