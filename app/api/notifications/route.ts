import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listNotifications } from "@/lib/fieldsync-store";
import { expireStalePendingReservations } from "@/lib/reservation-expiry";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get("userId") ?? 0);

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId es obligatorio" }, { status: 400 });
  }

  try {
    await expireStalePendingReservations();
  } catch (dbError) {
    console.warn("No pudimos vencer reservas pendientes:", dbError);
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { id_user: userId },
      orderBy: { sent_at: "desc" },
    });

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        id: notification.id_notification,
        userId: notification.id_user,
        type: notification.type,
        message: notification.message,
        createdAt: notification.sent_at.toISOString(),
        read: notification.is_read,
      })),
    });
  } catch (dbError) {
    console.warn("Prisma notifications query failed, falling back to in-memory store:", dbError);
  }

  return NextResponse.json({ notifications: listNotifications(userId) });
}