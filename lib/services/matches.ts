import { prisma } from "@/lib/prisma";
import { findSharedPlayerConflict, getTeamById, notifyTeamCaptain } from "@/lib/services/teams";
import { ensurePlayerProfile } from "@/lib/services/profiles";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isPowerOfTwo(value: number) {
  return value >= 2 && (value & (value - 1)) === 0;
}

async function loadTournamentForFixture(tournamentId: number) {
  return prisma.tournament.findUnique({
    where: { id_tournament: tournamentId },
    include: { estado: true, team_tournaments: true },
  });
}

function validateReadyToStart(tournament: {
  estado: { name: string };
  team_tournaments: { id_team: number }[];
  min_teams: number;
  format: string;
}): string | null {
  if (tournament.estado.name !== "aprobado") {
    return "El torneo aún no ha sido aprobado por el dueño de la cancha";
  }
  if (tournament.team_tournaments.length < tournament.min_teams) {
    return "Aún no se completa el número mínimo de equipos";
  }
  if (tournament.format === "eliminatorio" && !isPowerOfTwo(tournament.team_tournaments.length)) {
    return "Los torneos eliminatorios necesitan una cantidad de equipos potencia de 2 (2, 4, 8, 16...)";
  }
  return null;
}

// Solo se llama para torneos en modo "aleatorio" (el modo "manual" arma los
// pares a mano en setManualFixture) — por eso siempre sortea el orden de los
// equipos antes de emparejarlos.
function buildFixturePairs(teamIds: number[], format: string): Array<{ homeTeamId: number; awayTeamId: number }> {
  const shuffled = shuffle(teamIds);
  const pairs: Array<{ homeTeamId: number; awayTeamId: number }> = [];

  if (format === "todos-contra-todos") {
    for (let homeIndex = 0; homeIndex < shuffled.length; homeIndex += 1) {
      for (let awayIndex = homeIndex + 1; awayIndex < shuffled.length; awayIndex += 1) {
        pairs.push({ homeTeamId: shuffled[homeIndex], awayTeamId: shuffled[awayIndex] });
      }
    }
  } else {
    for (let index = 0; index < shuffled.length - 1; index += 2) {
      pairs.push({ homeTeamId: shuffled[index], awayTeamId: shuffled[index + 1] });
    }
  }

  return pairs;
}

async function persistFixture(
  tournament: { id_tournament: number; id_court: number },
  pairs: Array<{ homeTeamId: number; awayTeamId: number }>,
  round = 1,
) {
  await prisma.match.createMany({
    data: pairs.map((pair, index) => ({
      id_tournament: tournament.id_tournament,
      id_court: tournament.id_court,
      id_home_team: pair.homeTeamId,
      id_away_team: pair.awayTeamId,
      scheduled_at: new Date(Date.UTC(2026, 6, 28 + index, 19, 0, 0)),
      status: "scheduled",
      round,
    })),
  });
}

async function notifyTournamentStart(tournamentName: string, teamIds: number[]) {
  await Promise.all(
    teamIds.map((teamId) =>
      notifyTeamCaptain({
        teamId,
        type: "tournament",
        message: `El torneo ${tournamentName} ya tiene calendario generado.`,
      }),
    ),
  );
}

export async function startTournament(input: { tournamentId: number }) {
  const tournament = await loadTournamentForFixture(input.tournamentId);
  if (!tournament) {
    return { ok: false as const, error: "No encontramos el torneo" };
  }

  if (tournament.fixture_mode === "manual") {
    return {
      ok: false as const,
      error: "Este torneo usa calendario manual: armá los partidos y guardalos para iniciarlo",
    };
  }

  const validationError = validateReadyToStart(tournament);
  if (validationError) {
    return { ok: false as const, error: validationError };
  }

  const teamIds = tournament.team_tournaments.map((tt) => tt.id_team);
  const pairs = buildFixturePairs(teamIds, tournament.format);
  await persistFixture(tournament, pairs);
  await notifyTournamentStart(tournament.name, teamIds);

  return { ok: true as const };
}

export async function setManualFixture(input: {
  tournamentId: number;
  pairs: Array<{ homeTeamId: number; awayTeamId: number }>;
}) {
  const tournament = await loadTournamentForFixture(input.tournamentId);
  if (!tournament) {
    return { ok: false as const, error: "No encontramos el torneo" };
  }

  if (tournament.fixture_mode !== "manual") {
    return { ok: false as const, error: "Este torneo no está configurado para calendario manual" };
  }

  const validationError = validateReadyToStart(tournament);
  if (validationError) {
    return { ok: false as const, error: validationError };
  }

  if (input.pairs.length === 0) {
    return { ok: false as const, error: "Agrega al menos un partido al calendario" };
  }

  const teamIds = new Set(tournament.team_tournaments.map((tt) => tt.id_team));
  for (const pair of input.pairs) {
    if (pair.homeTeamId === pair.awayTeamId) {
      return { ok: false as const, error: "Un equipo no puede jugar contra sí mismo" };
    }
    if (!teamIds.has(pair.homeTeamId) || !teamIds.has(pair.awayTeamId)) {
      return { ok: false as const, error: "Todos los partidos deben ser entre equipos inscritos en el torneo" };
    }
  }

  for (const pair of input.pairs) {
    const conflict = await findSharedPlayerConflict([pair.homeTeamId, pair.awayTeamId]);
    if (conflict) {
      return {
        ok: false as const,
        error: `${conflict.teamA.name} y ${conflict.teamB.name} comparten jugadores: no pueden enfrentarse`,
      };
    }
  }

  await persistFixture(tournament, input.pairs);
  await notifyTournamentStart(tournament.name, Array.from(teamIds));

  return { ok: true as const };
}

async function recalculateStandings(tournamentId: number) {
  const tournament = await prisma.tournament.findUnique({
    where: { id_tournament: tournamentId },
    include: { team_tournaments: true },
  });
  if (!tournament) return [];

  const confirmedMatches = await prisma.match.findMany({
    where: { id_tournament: tournamentId, status: "confirmed" },
  });

  type StandingRow = {
    teamId: number;
    tournamentId: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };

  const standingsByTeam = new Map<number, StandingRow>();
  for (const tt of tournament.team_tournaments) {
    standingsByTeam.set(tt.id_team, {
      teamId: tt.id_team,
      tournamentId,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }

  for (const match of confirmedMatches) {
    if (match.home_goals === null || match.away_goals === null) continue;
    const home = standingsByTeam.get(match.id_home_team);
    const away = standingsByTeam.get(match.id_away_team);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.home_goals;
    home.goalsAgainst += match.away_goals;
    away.goalsFor += match.away_goals;
    away.goalsAgainst += match.home_goals;

    if (match.home_goals > match.away_goals) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.home_goals < match.away_goals) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = Array.from(standingsByTeam.values()).sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    const leftDiff = left.goalsFor - left.goalsAgainst;
    const rightDiff = right.goalsFor - right.goalsAgainst;
    if (rightDiff !== leftDiff) return rightDiff - leftDiff;
    return right.goalsFor - left.goalsFor;
  });

  await prisma.$transaction(
    standings.map((standing, index) =>
      prisma.standing.upsert({
        where: { id_tournament_id_team: { id_tournament: tournamentId, id_team: standing.teamId } },
        update: {
          points: standing.points,
          matches_played: standing.played,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          goals_for: standing.goalsFor,
          goals_against: standing.goalsAgainst,
          goal_difference: standing.goalsFor - standing.goalsAgainst,
          position: index + 1,
        },
        create: {
          id_tournament: tournamentId,
          id_team: standing.teamId,
          points: standing.points,
          matches_played: standing.played,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          goals_for: standing.goalsFor,
          goals_against: standing.goalsAgainst,
          goal_difference: standing.goalsFor - standing.goalsAgainst,
          position: index + 1,
        },
      }),
    ),
  );

  return standings;
}

// Arma la siguiente ronda del cuadro eliminatorio una vez que todos los
// partidos de la ronda actual quedaron confirmados: toma los ganadores, los
// sortea y los empareja. Si la ronda recién jugada era la final (un solo
// partido), no genera nada más — ya hay campeón.
async function advanceEliminationBracket(tournamentId: number, completedRound: number) {
  const roundMatches = await prisma.match.findMany({ where: { id_tournament: tournamentId, round: completedRound } });
  if (roundMatches.length <= 1) return;
  if (!roundMatches.every((match) => match.status === "confirmed")) return;

  const winners = roundMatches.map((match) => {
    if (match.home_goals === null || match.away_goals === null || match.home_goals === match.away_goals) return null;
    return match.home_goals > match.away_goals ? match.id_home_team : match.id_away_team;
  });
  if (winners.some((winner) => winner === null)) return;

  const shuffledWinners = shuffle(winners as number[]);
  const pairs: Array<{ homeTeamId: number; awayTeamId: number }> = [];
  for (let index = 0; index < shuffledWinners.length; index += 2) {
    pairs.push({ homeTeamId: shuffledWinners[index], awayTeamId: shuffledWinners[index + 1] });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id_tournament: tournamentId } });
  if (!tournament) return;
  await persistFixture(tournament, pairs, completedRound + 1);
}

export async function recordMatchResult(input: {
  matchId: number;
  stats?: Array<{ playerId: number; teamId: number; goals: number; yellowCards: number; redCards: number }>;
  homeGoals?: number;
  awayGoals?: number;
  confirmedByAdmin?: boolean;
}) {
  const match = await prisma.match.findUnique({ where: { id_match: input.matchId }, include: { tournament: true } });
  if (!match) {
    return { ok: false as const, error: "No encontramos el partido" };
  }

  const statRowsFromInput = Array.isArray(input.stats) ? input.stats : [];

  if (match.result_locked && !input.confirmedByAdmin) {
    // No se muta el audit trail hasta que la escritura en Postgres se
    // confirme: si se hiciera antes y el update fallara, el estado quedaría
    // "confirmado" sin que la base lo respalde.
    const rejectedAuditTrail = [
      ...match.audit_trail,
      "Intento de modificación rechazado: se requiere segunda autorización.",
    ];
    await prisma.match.update({ where: { id_match: match.id_match }, data: { audit_trail: rejectedAuditTrail } });
    return {
      ok: false as const,
      error: "Se requiere una segunda autorización para modificar un resultado confirmado",
      requiresSecondAuthorization: true,
      auditTrail: rejectedAuditTrail,
    };
  }

  const [homeTeam, awayTeam] = await Promise.all([getTeamById(match.id_home_team), getTeamById(match.id_away_team)]);

  for (const stat of statRowsFromInput) {
    if (stat.teamId !== match.id_home_team && stat.teamId !== match.id_away_team) {
      return { ok: false as const, error: `El equipo #${stat.teamId} no juega este partido` };
    }
    const team = stat.teamId === match.id_home_team ? homeTeam : awayTeam;
    if (!team || !team.playerIds.includes(stat.playerId)) {
      return {
        ok: false as const,
        error: `El jugador #${stat.playerId} no pertenece a ${team?.name ?? `equipo #${stat.teamId}`}`,
      };
    }
  }

  // Solo se guardan filas con algo cargado (gol o tarjeta); una fila en cero
  // no cuenta como "jugó" el partido.
  const statRows = statRowsFromInput.filter((stat) => stat.goals > 0 || stat.yellowCards > 0 || stat.redCards > 0);

  const homeGoals =
    input.homeGoals ?? statRows.filter((stat) => stat.teamId === match.id_home_team).reduce((sum, s) => sum + s.goals, 0);
  const awayGoals =
    input.awayGoals ?? statRows.filter((stat) => stat.teamId === match.id_away_team).reduce((sum, s) => sum + s.goals, 0);

  if (match.tournament?.format === "eliminatorio" && homeGoals === awayGoals) {
    return { ok: false as const, error: "Los partidos eliminatorios no pueden terminar en empate: definí un equipo ganador" };
  }

  const newAuditTrail = [
    ...match.audit_trail,
    input.confirmedByAdmin ? "Resultado modificado con segunda autorización" : "Resultado confirmado",
  ];

  // MatchStat.id_player referencia PlayerProfile.id_player, no User.id_user —
  // hay que resolverlo antes de insertar.
  const profileIdByUserId = new Map<number, number>();
  for (const stat of statRows) {
    if (!profileIdByUserId.has(stat.playerId)) {
      const profile = await ensurePlayerProfile(stat.playerId);
      profileIdByUserId.set(stat.playerId, profile.id_player);
    }
  }

  await prisma.$transaction([
    prisma.match.update({
      where: { id_match: match.id_match },
      data: {
        home_goals: homeGoals,
        away_goals: awayGoals,
        status: "confirmed",
        result_locked: true,
        audit_trail: newAuditTrail,
      },
    }),
    prisma.matchStat.deleteMany({ where: { id_match: match.id_match } }),
    ...(statRows.length > 0
      ? [
          prisma.matchStat.createMany({
            data: statRows.map((stat) => ({
              id_match: match.id_match,
              id_player: profileIdByUserId.get(stat.playerId)!,
              id_team: stat.teamId,
              goals: stat.goals,
              yellow_cards: stat.yellowCards,
              red_cards: stat.redCards,
            })),
          }),
        ]
      : []),
    ...statRows.map((stat) =>
      prisma.playerProfile.upsert({
        where: { id_user: stat.playerId },
        update: { goals: { increment: stat.goals }, matches_played: { increment: 1 } },
        create: { id_user: stat.playerId, visibility: "public", is_available: true, goals: stat.goals, matches_played: 1 },
      }),
    ),
  ]);

  const standings = await recalculateStandings(match.id_tournament!);

  if (homeTeam) {
    await notifyTeamCaptain({ teamId: homeTeam.id, type: "match-result", message: `Resultado actualizado para ${homeTeam.name}.` });
  }
  if (awayTeam) {
    await notifyTeamCaptain({ teamId: awayTeam.id, type: "match-result", message: `Resultado actualizado para ${awayTeam.name}.` });
  }

  if (match.tournament?.format === "eliminatorio" && match.id_tournament) {
    await advanceEliminationBracket(match.id_tournament, match.round);
  }

  return { ok: true as const, standings };
}
