import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPush } from "@/lib/notify";
import { ADMIN_ROLES, requireRole } from "@/lib/authz";

export async function GET(request: NextRequest) {
  const adminId = request.nextUrl.searchParams.get("adminId");
  const authz = await requireRole(adminId, ADMIN_ROLES);
  if (!authz.ok) {
    return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
  }

  const users = await prisma.user.findMany({
    include: { role: true, estado: true, verifier: true },
    orderBy: { full_name: "asc" },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id_user,
      fullName: user.full_name,
      nickname: user.nickname,
      email: user.email,
      role: user.role.name,
      roleLabel: user.role.label,
      status: user.estado.name,
      verifiedBy: user.verifier?.full_name ?? null,
      verifiedAt: user.verified_at ? user.verified_at.toISOString() : null,
      createdAt: user.created_at.toISOString(),
    })),
  });
}

// Verifica o suspende una cuenta tenant (HU-11): solo un admin de plataforma
// puede hacerlo, y solo aplica a usuarios con rol "tenant" (dueños de cancha).
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const targetUserId = Number(body?.userId);
    const action = String(body?.action ?? "");

    if (!targetUserId || (action !== "verify" && action !== "suspend")) {
      return NextResponse.json({ ok: false, error: "Faltan datos para procesar la acción" }, { status: 400 });
    }

    const authz = await requireRole(body?.adminId, ADMIN_ROLES);
    if (!authz.ok) {
      return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
    }
    const adminId = authz.userId;

    const target = await prisma.user.findUnique({
      where: { id_user: targetUserId },
      include: { role: true },
    });

    if (!target) {
      return NextResponse.json({ ok: false, error: "No encontramos el usuario" }, { status: 404 });
    }

    if (target.role.name !== "tenant") {
      return NextResponse.json(
        { ok: false, error: "Solo se puede verificar o suspender cuentas de dueños de cancha (tenant)" },
        { status: 400 },
      );
    }

    const nuevoEstado = await prisma.estado.findUniqueOrThrow({
      where: { name: action === "verify" ? "verificado" : "suspendido" },
    });

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id_user: targetUserId },
        data: {
          id_estado: nuevoEstado.id_estado,
          id_verifier: adminId,
          verified_at: new Date(),
        },
        include: { role: true, estado: true },
      }),
      prisma.estadoHistorial.create({
        data: {
          entidad: "tenant",
          id_entidad: targetUserId,
          id_estado_previo: target.id_estado,
          id_estado_nuevo: nuevoEstado.id_estado,
          id_changed_by: adminId,
        },
      }),
      prisma.notification.create({
        data: {
          id_user: targetUserId,
          type: "account-status",
          message:
            action === "verify"
              ? "Tu cuenta de dueño de cancha fue verificada. Ya podés publicar canchas y torneos."
              : "Tu cuenta de dueño de cancha fue suspendida por un administrador de plataforma.",
        },
      }),
    ]);

    notifyPush(
      targetUserId,
      action === "verify"
        ? "Tu cuenta de dueño de cancha fue verificada. Ya podés publicar canchas y torneos."
        : "Tu cuenta de dueño de cancha fue suspendida por un administrador de plataforma.",
    );

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id_user,
        status: updated.estado.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos procesar la acción" },
      { status: 500 },
    );
  }
}
