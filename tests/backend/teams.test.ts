import { describe, expect, it, vi } from "vitest";
import { createTeam, sendConvocation, updateTeamRoster } from "@/lib/services/teams";
import { prisma } from "@/lib/prisma";

// notifyPush llama a next/server's after(), que solo funciona dentro de un
// request real — se mockea para que los tests no exploten. notifyUser sigue
// escribiendo la fila real en la tabla notification (los tests la limpian
// en su finally), solo se salta el push.
vi.mock("@/lib/notify", () => ({
  notifyPush: vi.fn(),
  notifyUser: async (userId: number, enabled: boolean, type: string, message: string) => {
    if (!enabled) return;
    const { prisma } = await import("@/lib/prisma");
    await prisma.notification.create({ data: { id_user: userId, type, message } });
  },
}));

// Datos de la semilla (prisma/seed.ts): equipo 1 "Tigres del Barrio", capitán
// = usuario 3 (Capitán Deportivo), jugadores = [3, 4].
describe("teams service", () => {
  it("rejects a duplicate team name within the same tenant", async () => {
    const suffix = Date.now();
    const created = await createTeam({ tenantId: 2, name: `Equipo Duplicado ${suffix}`, captainUserId: 4 });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(created.error);

    try {
      const duplicate = await createTeam({ tenantId: 2, name: `equipo duplicado ${suffix}`, captainUserId: 3 });
      expect(duplicate.ok).toBe(false);
    } finally {
      await prisma.teamPlayer.deleteMany({ where: { id_team: created.team.id } });
      await prisma.team.deleteMany({ where: { id_team: created.team.id } });
    }
  });

  it("adds and removes a player from a team roster", async () => {
    const profileExistedBefore = Boolean(await prisma.playerProfile.findUnique({ where: { id_user: 2 } }));

    try {
      const added = await updateTeamRoster({ teamId: 1, playerId: 2, action: "add" });
      expect(added.ok).toBe(true);
      if (!added.ok) throw new Error(added.error);
      expect(added.team.playerIds).toContain(2);

      const removed = await updateTeamRoster({ teamId: 1, playerId: 2, action: "remove" });
      expect(removed.ok).toBe(true);
      if (!removed.ok) throw new Error(removed.error);
      expect(removed.team.playerIds).not.toContain(2);
    } finally {
      const profile = await prisma.playerProfile.findUnique({ where: { id_user: 2 } });
      if (profile) {
        await prisma.teamPlayer.deleteMany({ where: { id_team: 1, id_player: profile.id_player } });
        if (!profileExistedBefore) {
          await prisma.playerProfile.delete({ where: { id_user: 2 } });
        }
      }
    }
  });

  it("only lets the team captain send a convocation", async () => {
    try {
      const blocked = await sendConvocation({
        teamId: 1,
        senderUserId: 4,
        scheduledAt: "2026-08-01T19:00",
        courtName: "Arena Indoor Center",
      });
      expect(blocked.ok).toBe(false);

      const allowed = await sendConvocation({
        teamId: 1,
        senderUserId: 3,
        scheduledAt: "2026-08-01T19:00",
        courtName: "Arena Indoor Center",
      });
      expect(allowed.ok).toBe(true);
    } finally {
      await prisma.notification.deleteMany({
        where: { message: "Convocatoria para Tigres del Barrio: 2026-08-01T19:00 en Arena Indoor Center." },
      });
    }
  });
});
