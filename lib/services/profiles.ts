import { prisma } from "@/lib/prisma";

export async function ensurePlayerProfile(userId: number) {
  await prisma.playerProfile.upsert({
    where: { id_user: userId },
    update: {},
    create: { id_user: userId, visibility: "public", is_available: true },
  });
  return prisma.playerProfile.findUniqueOrThrow({ where: { id_user: userId } });
}

export async function getPlayerProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id_user: userId },
    include: { role: true },
  });
  if (!user) {
    return null;
  }

  const dbProfile = await ensurePlayerProfile(userId);

  const playedReservations = await prisma.reservation.findMany({
    where: { id_user: userId, status: "confirmada" },
    include: { court: { select: { name: true } } },
  });
  const courts = Array.from(new Set(playedReservations.map((r) => r.court.name)));

  const memberships = await prisma.teamPlayer.findMany({
    where: { id_player: dbProfile.id_player, is_active: true },
    include: {
      team: {
        include: {
          team_tournaments: { include: { tournament: true } },
        },
      },
    },
  });

  const tournaments = Array.from(
    new Set(memberships.flatMap((m) => m.team.team_tournaments.map((tt) => tt.tournament.name))),
  );

  const tournamentIds = Array.from(
    new Set(memberships.flatMap((m) => m.team.team_tournaments.map((tt) => tt.id_tournament))),
  );
  const teamIds = memberships.map((m) => m.id_team);

  const dbStandings =
    tournamentIds.length && teamIds.length
      ? await prisma.standing.findMany({
          where: { id_tournament: { in: tournamentIds }, id_team: { in: teamIds } },
        })
      : [];

  const standings = dbStandings.map((standing) => ({
    teamId: standing.id_team,
    tournamentId: standing.id_tournament,
    played: standing.matches_played,
    wins: standing.wins,
    draws: standing.draws,
    losses: standing.losses,
    goalsFor: standing.goals_for,
    goalsAgainst: standing.goals_against,
    points: standing.points,
  }));

  return {
    user: {
      id: user.id_user,
      fullName: user.full_name,
      nickname: user.nickname,
      email: user.email,
      role: user.role.name,
      notificationsEnabled: user.notifications_enabled,
    },
    profile: {
      id: dbProfile.id_player,
      userId: dbProfile.id_user,
      goals: dbProfile.goals,
      assists: dbProfile.assists,
      matchesPlayed: dbProfile.matches_played,
      tournaments,
      courts,
      visibility: dbProfile.visibility as "public" | "private",
    },
    tournaments,
    courts,
    standings,
  };
}

export async function updateProfileVisibility(input: { userId: number; visibility: "public" | "private" }) {
  const user = await prisma.user.findUnique({ where: { id_user: input.userId } });
  if (!user) {
    return { ok: false as const, error: "No encontramos el perfil" };
  }

  const dbProfile = await prisma.playerProfile.upsert({
    where: { id_user: input.userId },
    update: { visibility: input.visibility },
    create: { id_user: input.userId, visibility: input.visibility, is_available: true },
  });

  return {
    ok: true as const,
    profile: {
      id: dbProfile.id_player,
      userId: dbProfile.id_user,
      goals: dbProfile.goals,
      assists: dbProfile.assists,
      matchesPlayed: dbProfile.matches_played,
      tournaments: [] as string[],
      courts: [] as string[],
      visibility: dbProfile.visibility as "public" | "private",
    },
  };
}
