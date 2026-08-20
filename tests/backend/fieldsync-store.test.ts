import { beforeEach, describe, expect, it } from "vitest";
import {
  createTeam,
  createTournament,
  getPlayerProfile,
  loginUser,
  recordMatchResult,
  registerUser,
  resetFieldSyncStore,
  sendConvocation,
  startTournament,
  toggleNotifications,
  updateTeamRoster,
} from "@/lib/fieldsync-store";
import { prisma } from "@/lib/prisma";

describe("FieldSync store", () => {
  beforeEach(() => {
    resetFieldSyncStore();
  });

  it("authenticates and registers users with roles", () => {
    expect(loginUser("admin@fieldsync.test", "Admin1234!")).toMatchObject({
      email: "admin@fieldsync.test",
      role: "administrador",
    });

    const created = registerUser({
      fullName: "Nuevo Organizador",
      email: "nuevo@fieldsync.test",
      password: "Secret123!",
      role: "organizador",
    });

    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.user).toMatchObject({
        email: "nuevo@fieldsync.test",
        role: "organizador",
      });
    }
  });

  it("creates a tournament, generates fixtures, records results and updates standings", async () => {
    // Los 3 equipos de la semilla comparten todos al mismo capitán (usuario 3)
    // como jugador, así que cualquier combinación de 2+ de ellos siempre
    // dispara el chequeo de "jugadores compartidos" (se usa a propósito más
    // abajo para probar ese chequeo). Para poder armar un torneo real de
    // punta a punta se crean dos equipos nuevos sin jugadores en común, que
    // se limpian en el finally.
    const suffix = Date.now();
    const teamA = await createTeam({ tenantId: 2, name: `Equipo Test A ${suffix}`, captainUserId: 4 });
    const teamB = await createTeam({ tenantId: 2, name: `Equipo Test B ${suffix}`, captainUserId: 3 });
    expect(teamA.ok).toBe(true);
    expect(teamB.ok).toBe(true);
    if (!teamA.ok || !teamB.ok) {
      throw new Error("No se pudieron crear los equipos de prueba");
    }

    let tournamentId: number | null = null;

    try {
      const tournament = await createTournament({
        tenantId: 2,
        createdByUserId: 2,
        courtId: 1,
        name: `Copa de Verano ${suffix}`,
        format: "todos-contra-todos",
        teamIds: [teamA.team.id, teamB.team.id],
        startDate: "2026-08-01",
        endDate: "2026-08-21",
      });

      expect(tournament.ok).toBe(true);
      if (!tournament.ok) {
        throw new Error(tournament.error);
      }
      tournamentId = tournament.tournament.id;

      expect(tournament.tournament.requestStatus).toBe("aprobado");
      expect(tournament.tournament.teamIds).toEqual([teamA.team.id, teamB.team.id]);
      expect(tournament.tournament.courtId).toBe(1);

      // Equipos 1 y 2 de la semilla comparten al capitán (usuario 3): la
      // creación debe rechazarse por conflicto de jugadores.
      const conflictingCreate = await createTournament({
        tenantId: 2,
        createdByUserId: 2,
        courtId: 1,
        name: "Torneo con equipos en conflicto",
        format: "todos-contra-todos",
        teamIds: [1, 2],
        startDate: "2026-08-01",
        endDate: "2026-08-21",
      });
      expect(conflictingCreate.ok).toBe(false);
      if (!conflictingCreate.ok) {
        expect(conflictingCreate.error).toContain("comparten jugadores");
      }

      const invalidCourt = await createTournament({
        tenantId: 2,
        createdByUserId: 2,
        courtId: 999999,
        name: "Torneo cancha inexistente",
        format: "todos-contra-todos",
        teamIds: [teamA.team.id, teamB.team.id],
        startDate: "2026-08-01",
        endDate: "2026-08-21",
      });
      expect(invalidCourt.ok).toBe(false);

      const started = await startTournament({ tournamentId: tournament.tournament.id });
      expect(started.ok).toBe(true);
      if (!started.ok) {
        throw new Error(started.error);
      }

      expect(started.tournament.fixture.length).toBeGreaterThan(0);

      const firstMatch = started.tournament.fixture[0];
      const firstResult = await recordMatchResult({
        matchId: firstMatch.id,
        homeGoals: 3,
        awayGoals: 1,
      });

      expect(firstResult.ok).toBe(true);
      if (!firstResult.ok) {
        throw new Error(firstResult.error);
      }

      const lockedResult = await recordMatchResult({
        matchId: firstMatch.id,
        homeGoals: 1,
        awayGoals: 1,
      });

      expect(lockedResult.ok).toBe(false);
      if (!lockedResult.ok) {
        expect(lockedResult.requiresSecondAuthorization).toBe(true);
      }
    } finally {
      if (tournamentId) {
        await prisma.matchStat.deleteMany({ where: { match: { id_tournament: tournamentId } } });
        await prisma.match.deleteMany({ where: { id_tournament: tournamentId } });
        await prisma.standing.deleteMany({ where: { id_tournament: tournamentId } });
        await prisma.teamTournament.deleteMany({ where: { id_tournament: tournamentId } });
        await prisma.tournament.delete({ where: { id_tournament: tournamentId } });
      }
      const testTeamIds = [teamA.team.id, teamB.team.id];
      await prisma.teamPlayer.deleteMany({ where: { id_team: { in: testTeamIds } } });
      await prisma.team.deleteMany({ where: { id_team: { in: testTeamIds } } });
    }
  }, 20000);

  it("manages player profiles, roster changes and convocations", async () => {
    // updateTeamRoster/sendConvocation ahora escriben en la Postgres real,
    // así que esta prueba deja filas reales en
    // team_player/player_profile/notification para el equipo/usuario de la
    // semilla — se revierten en el finally para no ensuciar la base
    // compartida en cada corrida de la suite.
    const profileExistedBefore = Boolean(await prisma.playerProfile.findUnique({ where: { id_user: 2 } }));

    try {
      const visibility = toggleNotifications(4, false);
      expect(visibility.ok).toBe(true);

      const rosterUpdate = await updateTeamRoster({
        teamId: 1,
        playerId: 2,
        action: "add",
      });

      expect(rosterUpdate.ok).toBe(true);

      const blockedConvocation = await sendConvocation({
        teamId: 1,
        senderUserId: 4,
        scheduledAt: "2026-08-01T19:00",
        courtName: "Arena Indoor Center",
      });

      expect(blockedConvocation.ok).toBe(false);

      const convocation = await sendConvocation({
        teamId: 1,
        senderUserId: 3,
        scheduledAt: "2026-08-01T19:00",
        courtName: "Arena Indoor Center",
      });

      expect(convocation.ok).toBe(true);

      const profile = await getPlayerProfile(4);
      expect(profile).not.toBeNull();
      expect(profile?.profile.visibility).toBe("public");
      expect(profile?.tournaments).toContain("Torneo Apertura 2026");
    } finally {
      const profile2 = await prisma.playerProfile.findUnique({ where: { id_user: 2 } });
      if (profile2) {
        await prisma.teamPlayer.deleteMany({ where: { id_team: 1, id_player: profile2.id_player } });
        if (!profileExistedBefore) {
          await prisma.playerProfile.delete({ where: { id_user: 2 } });
        }
      }
      await prisma.notification.deleteMany({
        where: { message: "Convocatoria para Tigres del Barrio: 2026-08-01T19:00 en Arena Indoor Center." },
      });
    }
  });
});
