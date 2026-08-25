import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, requireRole } from "@/lib/authz";

export async function GET(request: NextRequest) {
  const adminId = request.nextUrl.searchParams.get("adminId");
  const authz = await requireRole(adminId, ADMIN_ROLES);
  if (!authz.ok) {
    return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
  }

  const courts = await prisma.court.findMany({
    include: { tenant: true },
    orderBy: [{ id_tenant: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    courts: courts.map((court) => ({
      id: court.id_court,
      name: court.name,
      address: court.address,
      surface: court.surface,
      hasLights: court.has_light,
      pricePerHour: court.price_per_hour !== null ? Number(court.price_per_hour) : null,
      isActive: court.is_active,
      tenantId: court.id_tenant,
      tenantName: court.tenant.full_name,
      tenantEmail: court.tenant.email,
      
    })),
  });
}

// Activa o desactiva una cancha: una cancha inactiva deja de aparecer en el
// listado público de disponibilidad (GET /api/courts ya filtra por is_active).
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const courtId = Number(body?.courtId);
    const isActive = Boolean(body?.isActive);

    if (!courtId) {
      return NextResponse.json({ ok: false, error: "Falta el id de la cancha" }, { status: 400 });
    }

    const authz = await requireRole(body?.adminId, ADMIN_ROLES);
    if (!authz.ok) {
      return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
    }

    const updated = await prisma.court.update({
      where: { id_court: courtId },
      data: { is_active: isActive },
    });

    return NextResponse.json({ ok: true, court: { id: updated.id_court, isActive: updated.is_active } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos actualizar la cancha" },
      { status: 500 },
    );
  }
}
