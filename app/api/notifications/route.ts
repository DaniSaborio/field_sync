/**
 * /api/notifications — GET: list the authenticated user's own notifications,
 * newest first. The user id comes from the verified session, never from a
 * client-supplied query param.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";
import { expireStalePendingReservations } from "@/lib/reservation-expiry";

export async function GET(request: NextRequest) {
  const authz = await requireAuth(request);
  if (!authz.ok) {
    return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
  }
  const userId = authz.userId;

  try {
    await expireStalePendingReservations();
  } catch (dbError) {
    console.warn("No pudimos vencer reservas pendientes:", dbError);
  }

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
}