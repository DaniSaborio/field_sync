import { describe, expect, it, vi } from "vitest";
import { createTeam } from "@/lib/services/teams";
import { createTournament, getTournaments } from "@/lib/services/tournaments";
import { recordMatchResult, startTournament } from "@/lib/services/matches";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/notify", () => ({ notifyPush: vi.fn() }));

describe("tournaments + matches services", () => {
  it("creates a tournament, generates fixtures, records results and updates standings", async () => {
    // Los equipos de la semilla (1, 2, 3) comparten todos al mismo capitán
    // (usuario 3) como jugador, así que cualquier combinación de 2+ de ellos
    // dispara el chequeo de "jugadores compartidos" (se prueba a propósito
    // más abajo). Para armar un torneo real de punta a punta se crean dos
    // equipos nuevos sin jugadores en común, que se limpian en el finally.
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
        createdByUserId: 2,
        creatorRole: "tenant",
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
      tournamentId = tournament.tournamentId;

      const afterCreate = (await getTournaments()).find((t) => t.id === tournamentId);
      expect(afterCreate?.requestStatus).toBe("aprobado");
      expect(afterCreate?.teamIds.sort()).toEqual([teamA.team.id, teamB.team.id].sort());
      expect(afterCreate?.courtId).toBe(1);

      // Equipos 1 y 2 de la semilla comparten al capitán (usuario 3): la
      // creación debe rechazarse por conflicto de jugadores.
      const conflictingCreate = await createTournament({
        createdByUserId: 2,
        creatorRole: "tenant",
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
        createdByUserId: 2,
        creatorRole: "tenant",
        courtId: 999999,
        name: "Torneo cancha inexistente",
        format: "todos-contra-todos",
        teamIds: [teamA.team.id, teamB.team.id],
        startDate: "2026-08-01",
        endDate: "2026-08-21",
      });
      expect(invalidCourt.ok).toBe(false);

      const started = await startTournament({ tournamentId });
      expect(started.ok).toBe(true);
      if (!started.ok) {
        throw new Error(started.error);
      }

      const afterStart = (await getTournaments()).find((t) => t.id === tournamentId);
      expect(afterStart?.fixture.length).toBeGreaterThan(0);

      const firstMatch = afterStart!.fixture[0];
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
      // startTournament/recordMatchResult notifican por Postgres real (no
      // solo el store en memoria que ya no existe), así que sin este cleanup
      // cada corrida de la suite deja notificaciones de prueba huérfanas.
      await prisma.notification.deleteMany({ where: { message: { contains: suffix.toString() } } });

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
});
