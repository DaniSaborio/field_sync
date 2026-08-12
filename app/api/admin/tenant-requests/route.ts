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
        const tenantRole = await prisma.role.findUnique({
          where: { name: "tenant" },
        });

        if (tenantRole) {
          const updatedUser = await prisma.user.update({
            where: { id_user: requestUser.id_user },
            data: {
              id_role: tenantRole.id_role,
            },
            include: { role: true },
          });

          upsertStoreUser({
            id: updatedUser.id_user,
            fullName: updatedUser.full_name,
            nickname: updatedUser.nickname,
            email: updatedUser.email,
            role: "organizador",
            tenantId: updatedUser.id_user,
            notificationsEnabled: updatedUser.notifications_enabled,
          });

          createUserNotification(
            updatedUser.id_user,
            "account-status",
            "Tu solicitud como dueño de cancha fue aprobada. Ya podés administrar tu cancha desde tu panel."
          );

          await prisma.notification.create({
            data: {
              id_user: updatedUser.id_user,
              type: "account-status",
              message: "Tu solicitud como dueño de cancha fue aprobada. Ya podés administrar tu cancha desde tu panel.",
            },
          });
          notifyPush(
            updatedUser.id_user,
            "Tu solicitud como dueño de cancha fue aprobada. Ya podés administrar tu cancha desde tu panel.",
          );
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
