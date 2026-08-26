import { describe, expect, it } from "vitest";
import { getPlayerProfile } from "@/lib/services/profiles";

// Usuario 4 (Jugador Demo) es miembro de los equipos 1 y 3 de la semilla,
// ambos inscritos en "Torneo Apertura 2026" (prisma/seed.ts).
describe("profiles service", () => {
  it("resolves a player's profile with their tournament participation", async () => {
    const profile = await getPlayerProfile(4);
    expect(profile).not.toBeNull();
    expect(profile?.profile.visibility).toBe("public");
    expect(profile?.tournaments).toContain("Torneo Apertura 2026");
  });

  it("returns null for a user that doesn't exist", async () => {
    const profile = await getPlayerProfile(999999);
    expect(profile).toBeNull();
  });
});
