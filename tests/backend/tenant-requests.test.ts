import { describe, expect, it } from "vitest";
import {
  listTenantRequests,
  submitTenantRequest,
  updateTenantRequestStatus,
} from "@/lib/tenant-requests";

describe("tenant request flow", () => {
  it("stores a tenant request and lets the admin review it", () => {
    const created = submitTenantRequest({
      userId: 42,
      userEmail: "jugador@test.com",
      complexName: "Complejo El Sol",
      phone: "8888-8888",
      address: "San José",
      mapsUrl: "https://maps.google.com/example",
      courtName: "Cancha 1",
      surface: "Sintética",
      capacity: "5 vs 5",
      price: "12000",
      hasLights: true,
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      throw new Error(created.error);
    }

    expect(listTenantRequests()).toHaveLength(1);
    expect(listTenantRequests()[0]?.status).toBe("pendiente");
    expect(listTenantRequests()[0]?.hasLights).toBe(true);

    const reviewed = updateTenantRequestStatus({
      requestId: created.request.id,
      status: "aprobado",
      reviewerName: "Admin Plataforma",
      notes: "Datos correctos",
    });

    expect(reviewed.ok).toBe(true);
    if (!reviewed.ok) {
      throw new Error(reviewed.error);
    }

    expect(listTenantRequests()[0]?.status).toBe("aprobado");
  });
});
