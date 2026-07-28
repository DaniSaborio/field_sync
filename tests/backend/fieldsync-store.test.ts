import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelReservation,
  createTournament,
  enrollTeamToTournament,
  getPlayerProfile,
  loginUser,
  recordMatchResult,
  registerUser,
  reserveCourt,
  resetFieldSyncStore,
  sendConvocation,
  startTournament,
  toggleNotifications,
  updateTeamRoster,
} from "@/lib/fieldsync-store";

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

  it("reserves and cancels courts using the 24-hour rule", () => {
    const reservation = reserveCourt({
      userId: 1,
      courtId: 2,
      date: "2026-08-15",
      timeSlot: "11:00",
    });

    expect(reservation.ok).toBe(true);
    if (!reservation.ok) {
      throw new Error(reservation.error);
    }

    const conflict = reserveCourt({
      userId: 1,
      courtId: 2,
      date: "2026-08-15",
      timeSlot: "11:00",
    });

    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.error).toBe("Franja no disponible");
    }

    const allowedCancellation = cancelReservation({
      reservationId: reservation.reservation.id,
      userId: 1,
      now: new Date("2026-08-13T08:00:00.000Z"),
    });

    expect(allowedCancellation.ok).toBe(true);

    const blockedCancellation = cancelReservation({
      reservationId: 1,
      userId: 4,
      now: new Date("2026-07-29T12:00:00.000Z"),
    });

    expect(blockedCancellation.ok).toBe(false);
    if (!blockedCancellation.ok) {
      expect(blockedCancellation.error).toContain("24 horas");
    }
  });

  it("creates a tournament, generates fixtures and updates standings", () => {
    const tournament = createTournament({
      tenantId: 1,
      name: "Copa de Verano",
      format: "todos-contra-todos",
      teamsRequired: 3,
      startDate: "2026-08-01",
      endDate: "2026-08-21",
    });

    expect(tournament.ok).toBe(true);
    if (!tournament.ok) {
      throw new Error(tournament.error);
    }

    enrollTeamToTournament({ tournamentId: tournament.tournament.id, teamId: 1 });
    enrollTeamToTournament({ tournamentId: tournament.tournament.id, teamId: 2 });
    enrollTeamToTournament({ tournamentId: tournament.tournament.id, teamId: 3 });

    const started = startTournament({ tournamentId: tournament.tournament.id });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      throw new Error(started.error);
    }

    expect(started.tournament.fixture.length).toBeGreaterThan(0);

    const firstMatch = started.tournament.fixture[0];
    const firstResult = recordMatchResult({
      matchId: firstMatch.id,
      homeGoals: 3,
      awayGoals: 1,
    });

    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) {
      throw new Error(firstResult.error);
    }

    const lockedResult = recordMatchResult({
      matchId: firstMatch.id,
      homeGoals: 1,
      awayGoals: 1,
    });

    expect(lockedResult.ok).toBe(false);
    if (!lockedResult.ok) {
      expect(lockedResult.requiresSecondAuthorization).toBe(true);
    }
  });

  it("manages player profiles, roster changes and convocations", () => {
    const visibility = toggleNotifications(4, false);
    expect(visibility.ok).toBe(true);

    const rosterUpdate = updateTeamRoster({
      teamId: 1,
      playerId: 2,
      action: "add",
    });

    expect(rosterUpdate.ok).toBe(true);

    const convocation = sendConvocation({
      teamId: 1,
      scheduledAt: "2026-08-01T19:00",
      courtName: "Arena Indoor Center",
    });

    expect(convocation.ok).toBe(true);

    const profile = getPlayerProfile(4);
    expect(profile).not.toBeNull();
    expect(profile?.profile.visibility).toBe("public");
    expect(profile?.tournaments).toContain("Torneo Apertura 2026");
  });
});
