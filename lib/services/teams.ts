import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";
import { ensurePlayerProfile } from "@/lib/services/profiles";

type TeamDTO = {
  id: number;
  tenantId: number;
  name: string;
  captainUserId: number;
  playerIds: number[];
};

const rosterInclude = {
  team_players: {
    where: { is_active: true },
    include: { player_profile: { include: { user: true } } },
  },
} as const;

function toTeamDTO(team: {
  id_team: number;
  id_tenant: number;
  id_user: number;
  name: string;
  team_players: { player_profile: { id_user: number } }[];
}): TeamDTO {
  return {
    id: team.id_team,
    tenantId: team.id_tenant,
    name: team.name,
    captainUserId: team.id_user,
    playerIds: team.team_players.map((tp) => tp.player_profile.id_user),
  };
}

export async function getTeamById(teamId: number): Promise<TeamDTO | null> {
  const team = await prisma.team.findUnique({ where: { id_team: teamId }, include: rosterInclude });
  return team ? toTeamDTO(team) : null;
}

export async function listTeams() {
  const teams = await prisma.team.findMany({ include: rosterInclude, orderBy: { id_team: "asc" } });

  return teams.map((team) => ({
    ...toTeamDTO(team),
    players: team.team_players.map((tp) => ({
      id: tp.player_profile.user.id_user,
      fullName: tp.player_profile.user.full_name,
      nickname: tp.player_profile.user.nickname,
      email: tp.player_profile.user.email,
    })),
  }));
}

// Ningún par de equipos dentro de un mismo torneo puede compartir jugadores:
// si comparten, ese jugador podría terminar emparejado contra sí mismo cuando
// el fixture (automático o manual) los haga jugar entre sí.
export async function findSharedPlayerConflict(
  teamIds: number[],
): Promise<{ teamA: TeamDTO; teamB: TeamDTO } | null> {
  const teams = await prisma.team.findMany({ where: { id_team: { in: teamIds } }, include: rosterInclude });
  const dtos = teams.map(toTeamDTO);

  for (let i = 0; i < dtos.length; i += 1) {
    for (let j = i + 1; j < dtos.length; j += 1) {
      const playersInB = new Set(dtos[j].playerIds);
      if (dtos[i].playerIds.some((playerId) => playersInB.has(playerId))) {
        return { teamA: dtos[i], teamB: dtos[j] };
      }
    }
  }
  return null;
}

export async function createTeam(input: { tenantId: number; name: string; captainUserId: number }) {
  const captain = await prisma.user.findUnique({ where: { id_user: input.captainUserId } });
  if (!captain) {
    return { ok: false as const, error: "No pudimos identificar al usuario" };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false as const, error: "El nombre del equipo es obligatorio" };
  }

  const existing = await prisma.team.findFirst({
    where: { id_tenant: input.tenantId, name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    return { ok: false as const, error: "Ya existe un equipo con ese nombre" };
  }

  const captainProfile = await ensurePlayerProfile(input.captainUserId);
  const dbTeam = await prisma.team.create({
    data: {
      id_tenant: input.tenantId,
      id_user: input.captainUserId,
      name,
      // El creador queda automáticamente como capitán y primer jugador de la plantilla.
      team_players: { create: [{ id_player: captainProfile.id_player }] },
    },
    include: rosterInclude,
  });

  return { ok: true as const, team: toTeamDTO(dbTeam) };
}

export async function updateTeamRoster(input: { teamId: number; action: "add" | "remove"; playerId: number }) {
  const team = await prisma.team.findUnique({ where: { id_team: input.teamId }, include: rosterInclude });
  const player = await prisma.user.findUnique({ where: { id_user: input.playerId } });

  if (!team || !player) {
    return { ok: false as const, error: "No encontramos el equipo o el jugador" };
  }

  if (input.action === "add") {
    const profile = await ensurePlayerProfile(player.id_user);
    await prisma.teamPlayer.upsert({
      where: { id_team_id_player: { id_team: team.id_team, id_player: profile.id_player } },
      update: { is_active: true },
      create: { id_team: team.id_team, id_player: profile.id_player, is_active: true },
    });
  } else {
    const profile = await prisma.playerProfile.findUnique({ where: { id_user: player.id_user } });
    if (profile) {
      await prisma.teamPlayer.deleteMany({ where: { id_team: team.id_team, id_player: profile.id_player } });
    }
  }

  const updated = await prisma.team.findUniqueOrThrow({ where: { id_team: team.id_team }, include: rosterInclude });
  return { ok: true as const, team: toTeamDTO(updated) };
}

export async function sendConvocation(input: {
  teamId: number;
  senderUserId: number;
  scheduledAt: string;
  courtName: string;
}) {
  const team = await prisma.team.findUnique({ where: { id_team: input.teamId }, include: rosterInclude });
  if (!team) {
    return { ok: false as const, error: "No encontramos el equipo" };
  }

  if (team.id_user !== input.senderUserId) {
    return { ok: false as const, error: "Solo el capitán del equipo puede enviar convocatorias" };
  }

  const message = `Convocatoria para ${team.name}: ${input.scheduledAt} en ${input.courtName}.`;
  await Promise.all(
    team.team_players.map((tp) => {
      const player = tp.player_profile.user;
      return notifyUser(player.id_user, player.notifications_enabled, "convocation", message);
    }),
  );

  return { ok: true as const };
}

export async function notifyTeamMembers(input: {
  teamId: number;
  excludeUserId?: number;
  type: string;
  message: (member: { id_user: number; full_name: string; notifications_enabled: boolean }) => string;
}) {
  const team = await prisma.team.findUnique({ where: { id_team: input.teamId }, include: rosterInclude });
  if (!team) return;

  await Promise.all(
    team.team_players
      .map((tp) => tp.player_profile.user)
      .filter((member) => member.id_user !== input.excludeUserId)
      .map((member) => notifyUser(member.id_user, member.notifications_enabled, input.type, input.message(member))),
  );
}

export async function notifyTeamCaptain(input: { teamId: number; type: string; message: string }) {
  const team = await prisma.team.findUnique({ where: { id_team: input.teamId }, include: { user: true } });
  if (!team) return;
  await notifyUser(team.id_user, team.user.notifications_enabled, input.type, input.message);
}
