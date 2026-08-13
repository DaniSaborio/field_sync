import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserNotification, upsertStoreUser } from "@/lib/fieldsync-store";
import { notifyPush } from "@/lib/notify";
import {
  listTenantRequests,
  submitTenantRequest,
  updateTenantRequestStatus,
} from "@/lib/tenant-requests";

export async function GET() {
  return NextResponse.json({
    requests: listTenantRequests(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = submitTenantRequest({
      userId: body?.userId,
      userEmail: body?.userEmail,
      complexName: body?.complexName,
      phone: body?.phone,
      address: body?.address,
      mapsUrl: body?.mapsUrl,
      courtName: body?.courtName,
      surface: body?.surface,
      capacity: body?.capacity,
      price: body?.price,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Solicitud enviada correctamente.", request: result.request });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo enviar la solicitud.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = updateTenantRequestStatus({
      requestId: body?.requestId,
      status: body?.status,
      reviewerName: body?.reviewerName,
      notes: body?.notes,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    if (result.request.status === "aprobado") {
      const requestUser = await prisma.user.findUnique({
        where: { id_user: result.request.userId },
        include: { role: true },
      });

      if (requestUser) {
        const wasAlreadyTenant = requestUser.role.name === "tenant";
        const tenantRole = wasAlreadyTenant
          ? requestUser.role
          : await prisma.role.findUnique({ where: { name: "tenant" } });

        if (tenantRole) {
          const updatedUser = wasAlreadyTenant
            ? requestUser
            : await prisma.user.update({
                where: { id_user: requestUser.id_user },
                data: {
                  id_role: tenantRole.id_role,
                },
                include: { role: true },
              });

          if (!wasAlreadyTenant) {
            upsertStoreUser({
              id: updatedUser.id_user,
              fullName: updatedUser.full_name,
              nickname: updatedUser.nickname,
              email: updatedUser.email,
              role: "organizador",
              tenantId: updatedUser.id_user,
              notificationsEnabled: updatedUser.notifications_enabled,
            });
          }

          const price = Number(result.request.price);

          await prisma.court.create({
            data: {
              id_tenant: updatedUser.id_user,
              name: result.request.courtName,
              address: result.request.address || null,
              maps_url: result.request.mapsUrl || null,
              surface: result.request.surface || null,
              capacity: result.request.capacity || null,
              price_per_hour: Number.isFinite(price) ? price : null,
            },
          });

          const message = wasAlreadyTenant
            ? `Tu solicitud para agregar la cancha "${result.request.courtName}" fue aprobada. Ya está disponible en tu panel.`
            : "Tu solicitud como dueño de cancha fue aprobada. Ya podés administrar tu cancha desde tu panel.";

          createUserNotification(updatedUser.id_user, "account-status", message);

          await prisma.notification.create({
            data: {
              id_user: updatedUser.id_user,
              type: "account-status",
              message,
            },
          });
          notifyPush(updatedUser.id_user, message);
        }
      }
    }

    return NextResponse.json({ ok: true, request: result.request });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo actualizar la solicitud.",
      },
      { status: 500 },
    );
  }
}
