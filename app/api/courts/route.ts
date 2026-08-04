import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelReservation, listCourts as listCourtsMemory, reserveCourt as reserveCourtMemory } from "@/lib/fieldsync-store";

const DEFAULT_SLOTS = [
  "08:00", "09:00", "09:30", "10:30", "11:00", "12:00",
  "13:00", "15:00", "16:30", "17:30", "18:00", "19:00", "20:00", "21:00",
];

function slotMatchesTimeRange(slot: string, timeSlot: string) {
  if (!timeSlot || timeSlot === "all") return true;
  const [hourPart] = slot.split(":");
  const hour = Number(hourPart);
  if (timeSlot === "morning") return hour < 12;
  if (timeSlot === "afternoon") return hour >= 12 && hour < 18;
  if (timeSlot === "night") return hour >= 18;
  return true;
}

function parseSlotTime(dateIso: string, slot: string) {
  const [h, m] = slot.split(":").map(Number);
  const d = new Date(`${dateIso}T00:00:00.000Z`);
  d.setUTCHours(h, m ?? 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? undefined;
  const timeSlot = url.searchParams.get("timeSlot") ?? undefined;
  const surface = url.searchParams.get("surface") ?? undefined;
  const userId = url.searchParams.get("userId");

  try {
    const courtsFromDb = await prisma.court.findMany({
      where: { is_active: true },
      include: {
        reservations: {
          where: date ? { date: new Date(date) } : undefined,
        },
      },
    });

    if (courtsFromDb.length > 0) {
      const courts = courtsFromDb
  .filter((court: (typeof courtsFromDb)[number]) => {
          if (surface && surface !== "all" && court.surface !== surface) return false;
          return true;
        })
        .map((court) => {
          const reservedSlots = new Set(
            court.reservations
              .filter((r) => r.status === "confirmed")
              .map((r) => {
                const h = r.start_time.getUTCHours().toString().padStart(2, "0");
                const m = r.start_time.getUTCMinutes().toString().padStart(2, "0");
                return `${h}:${m}`;
              }),
          );

          const availableSlots = DEFAULT_SLOTS.filter(
            (slot) => slotMatchesTimeRange(slot, timeSlot ?? "all") && !reservedSlots.has(slot),
          );

          const reservations = court.reservations
            .filter((r) => (userId ? r.id_user === Number(userId) : true))
            .map((r) => {
              const h = r.start_time.getUTCHours().toString().padStart(2, "0");
              const m = r.start_time.getUTCMinutes().toString().padStart(2, "0");
              return {
                id: r.id_reservation,
                userId: r.id_user,
                courtId: r.id_court,
                date: r.date.toISOString().slice(0, 10),
                timeSlot: `${h}:${m}`,
                status: r.status as "confirmed" | "cancelled",
                createdAt: r.created_at.toISOString(),
              };
            });

          return {
            id: court.id_court,
            tenantId: court.id_tenant,
            name: court.name,
            location: court.address ?? "Ubicación no disponible",
            surface: court.surface as "synthetic" | "natural" | "indoor",
            capacity: court.capacity,
            pricePerHour: Number(court.price_per_hour),
            rating: Number(court.rating),
            availableSlots,
            reservations,
          };
        })
        .filter((court) => court.availableSlots.length > 0 || court.reservations.length > 0);

      return NextResponse.json({ courts });
    }
  } catch (dbError) {
    console.warn("Prisma courts query failed, falling back to in-memory store:", dbError);
  }

  return NextResponse.json({
    courts: listCourtsMemory({
      date,
      timeSlot,
      surface,
      userId: userId ? Number(userId) : undefined,
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = Number(body?.userId);
    const courtId = Number(body?.courtId);
    const date = String(body?.date ?? "");
    const timeSlot = String(body?.timeSlot ?? "");

    if (!userId || !courtId || !date || !timeSlot) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos para procesar la reserva" },
        { status: 400 },
      );
    }

    const startDateTime = parseSlotTime(date, timeSlot);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    const dateOnly = new Date(`${date}T00:00:00.000Z`);

    try {
      const [courtExists, userExists] = await Promise.all([
        prisma.court.findUnique({ where: { id_court: courtId } }),
        prisma.user.findUnique({ where: { id_user: userId } }),
      ]);

      if (courtExists && userExists) {
        const conflict = await prisma.reservation.findFirst({
          where: {
            id_court: courtId,
            date: dateOnly,
            start_time: startDateTime,
            status: "confirmed",
          },
        });

        if (conflict) {
          const laterSlots = DEFAULT_SLOTS.filter((s) => s > timeSlot);
          let suggestedSlot: string | null = null;
          for (const slot of laterSlots) {
            const sStart = parseSlotTime(date, slot);
            const taken = await prisma.reservation.findFirst({
              where: { id_court: courtId, date: dateOnly, start_time: sStart, status: "confirmed" },
            });
            if (!taken) {
              suggestedSlot = slot;
              break;
            }
          }
          return NextResponse.json(
            { ok: false, error: "Franja no disponible", suggestedSlot },
            { status: 409 },
          );
        }

        const reservation = await prisma.reservation.create({
          data: {
            id_court: courtId,
            id_user: userId,
            date: dateOnly,
            start_time: startDateTime,
            end_time: endDateTime,
            status: "confirmed",
          },
        });

        if (userExists.notifications_enabled) {
          await prisma.notification.create({
            data: {
              id_user: userId,
              type: "reservation",
              message: `Reserva confirmada para ${courtExists.name} a las ${timeSlot}.`,
            },
          });
        }

        return NextResponse.json(
          {
            ok: true,
            reservation: {
              id: reservation.id_reservation,
              userId: reservation.id_user,
              courtId: reservation.id_court,
              date,
              timeSlot,
              status: reservation.status,
              createdAt: reservation.created_at.toISOString(),
            },
          },
          { status: 201 },
        );
      }
    } catch (dbError) {
      console.warn("Prisma reserve court failed, falling back to in-memory store:", dbError);
    }

    const result = reserveCourtMemory({ userId, courtId, date, timeSlot });
    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos procesar la reserva" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const reservationId = Number(body?.reservationId);
    const userId = Number(body?.userId);
    const now = body?.now ? new Date(String(body.now)) : new Date();

    if (!reservationId || !userId) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos para procesar la cancelación" },
        { status: 400 },
      );
    }

    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id_reservation: reservationId },
        include: { court: true, user: true },
      });

      if (reservation) {
        if (reservation.id_user !== userId) {
          return NextResponse.json(
            { ok: false, error: "No encontramos la reserva solicitada" },
            { status: 409 },
          );
        }

        const reservationDateTime = new Date(reservation.start_time);
        const hoursDifference =
          (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDifference < 24) {
          return NextResponse.json(
            { ok: false, error: "No es posible cancelar con menos de 24 horas de anticipación" },
            { status: 409 },
          );
        }

        const updated = await prisma.reservation.update({
          where: { id_reservation: reservationId },
          data: { status: "cancelled" },
        });

        const notifications = [];
        if (reservation.user?.notifications_enabled) {
          const notif = await prisma.notification.create({
            data: {
              id_user: userId,
              type: "cancellation",
              message: `Cancelamos tu reserva en ${reservation.court?.name ?? "la cancha"} para ${updated.date.toISOString().slice(0, 10)}.`,
            },
          });
          notifications.push(notif);
        }

        return NextResponse.json({
          ok: true,
          reservation: {
            id: updated.id_reservation,
            userId: updated.id_user,
            courtId: updated.id_court,
            date: updated.date.toISOString().slice(0, 10),
            timeSlot: `${updated.start_time.getUTCHours().toString().padStart(2, "0")}:${updated.start_time.getUTCMinutes().toString().padStart(2, "0")}`,
            status: updated.status,
            createdAt: updated.created_at.toISOString(),
          },
          notifications,
        });
      }
    } catch (dbError) {
      console.warn("Prisma cancel reservation failed, falling back to in-memory store:", dbError);
    }

    const result = cancelReservation({ reservationId, userId, now });
    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos cancelar la reserva" },
      { status: 500 },
    );
  }
}
