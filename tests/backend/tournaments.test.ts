import { describe, expect, it, vi } from "vitest";
import { createTeam } from "@/lib/services/teams";
import { closeTournament, createTournament, enrollTeamToTournament, getTournaments } from "@/lib/services/tournaments";
import { recordMatchResult, startTournament } from "@/lib/services/matches";
import { prisma } from "@/lib/prisma";

// notifyPush llama a next/server's after(), que solo funciona dentro de un
// request real — se mockea para que los tests no exploten. notifyUser sigue
// escribiendo la fila real en la tabla notification (se limpia en el
// finally por el `suffix`), solo se salta el push.
vi.mock("@/lib/notify", () => ({
  notifyPush: vi.fn(),
  notifyUser: async (userId: number, enabled: boolean, type: string, message: string) => {
    if (!enabled) return;
    const { prisma } = await import("@/lib/prisma");
    await prisma.notification.create({ data: { id_user: userId, type, message } });
  },
}));

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
    const testTeamIds = [teamA.team.id, teamB.team.id];

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

      // El torneo ya tiene calendario (matches creados): no debe aceptar más equipos.
      const teamC = await createTeam({ tenantId: 2, name: `Equipo Test C ${suffix}`, captainUserId: 2 });
      expect(teamC.ok).toBe(true);
      if (!teamC.ok) {
        throw new Error("No se pudo crear el equipo de prueba C");
      }
      testTeamIds.push(teamC.team.id);

      const lateEnroll = await enrollTeamToTournament({ tournamentId, teamId: teamC.team.id });
      expect(lateEnroll.ok).toBe(false);
      if (!lateEnroll.ok) {
        expect(lateEnroll.error).toContain("ya comenzó");
      }

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
      await prisma.teamPlayer.deleteMany({ where: { id_team: { in: testTeamIds } } });
      await prisma.team.deleteMany({ where: { id_team: { in: testTeamIds } } });
    }
  }, 20000);

  it("closes a tournament and blocks further enrollment or fixture changes", async () => {
    const suffix = Date.now();
    const teamD = await createTeam({ tenantId: 2, name: `Equipo Test D ${suffix}`, captainUserId: 4 });
    const teamE = await createTeam({ tenantId: 2, name: `Equipo Test E ${suffix}`, captainUserId: 3 });
    expect(teamD.ok).toBe(true);
    expect(teamE.ok).toBe(true);
    if (!teamD.ok || !teamE.ok) {
      throw new Error("No se pudieron crear los equipos de prueba");
    }

    let tournamentId: number | null = null;
    const testTeamIds = [teamD.team.id, teamE.team.id];

    try {
      const tournament = await createTournament({
        createdByUserId: 2,
        creatorRole: "tenant",
        courtId: 1,
        name: `Torneo a Cerrar ${suffix}`,
        format: "todos-contra-todos",
        teamIds: [teamD.team.id, teamE.team.id],
        startDate: "2026-08-01",
        endDate: "2026-08-21",
      });
      expect(tournament.ok).toBe(true);
      if (!tournament.ok) {
        throw new Error(tournament.error);
      }
      tournamentId = tournament.tournamentId;

      // Un jugador sin relación con la cancha no puede cerrar el torneo de otro dueño.
      const unauthorizedClose = await closeTournament({ tournamentId, responderId: 4, responderRole: "jugador" });
      expect(unauthorizedClose.ok).toBe(false);
      if (!unauthorizedClose.ok) {
        expect(unauthorizedClose.error).toContain("no pertenece");
      }

      const closed = await closeTournament({ tournamentId, responderId: 2, responderRole: "tenant" });
      expect(closed.ok).toBe(true);

      const afterClose = (await getTournaments()).find((t) => t.id === tournamentId);
      expect(afterClose?.status).toBe("closed");
      expect(afterClose?.closedAt).not.toBeNull();

      const enrollAfterClose = await enrollTeamToTournament({ tournamentId, teamId: teamD.team.id });
      expect(enrollAfterClose.ok).toBe(false);
      if (!enrollAfterClose.ok) {
        expect(enrollAfterClose.error).toContain("cerrado");
      }

      const startAfterClose = await startTournament({ tournamentId });
      expect(startAfterClose.ok).toBe(false);
      if (!startAfterClose.ok) {
        expect(startAfterClose.error).toContain("cerrado");
      }

      const doubleClose = await closeTournament({ tournamentId, responderId: 2, responderRole: "tenant" });
      expect(doubleClose.ok).toBe(false);
      if (!doubleClose.ok) {
        expect(doubleClose.error).toContain("ya estaba cerrado");
      }
    } finally {
      if (tournamentId) {
        await prisma.teamTournament.deleteMany({ where: { id_tournament: tournamentId } });
        await prisma.tournament.delete({ where: { id_tournament: tournamentId } });
      }
      await prisma.teamPlayer.deleteMany({ where: { id_team: { in: testTeamIds } } });
      await prisma.team.deleteMany({ where: { id_team: { in: testTeamIds } } });
    }
  }, 20000);
});
