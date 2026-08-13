import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureTeamsHydrated,
  getTeamById,
  listCourts as listCourtsMemory,
  notifyTeamCaptain,
  notifyTeamMembers,
} from "@/lib/fieldsync-store";
import { isNightHour, slotToUtcDate, utcDateToSlot } from "@/lib/utils";
import { resolveNightRate, type RateCandidate } from "@/lib/rates";
import { expireStalePendingReservations } from "@/lib/reservation-expiry";
import { notifyPush } from "@/lib/notify";

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
  return slotToUtcDate(dateIso, slot);
}

const HOLD_DURATION_MS = 30 * 60 * 1000;

// Un horario está ocupado si tiene una reserva "confirmada", o una "pendiente"
// cuyo hold todavía no vence (mientras el dueño no confirme el pago).
function activeSlotWhere(courtId: number, date: Date, startTime: Date) {
  return {
    id_court: courtId,
    date,
    start_time: startTime,
    OR: [
      { status: "confirmada" },
      {
        status: "pendiente",
        OR: [{ hold_expires_at: null }, { hold_expires_at: { gt: new Date() } }],
      },
    ],
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? undefined;
  const timeSlot = url.searchParams.get("timeSlot") ?? undefined;
  const surface = url.searchParams.get("surface") ?? undefined;
  const userId = url.searchParams.get("userId");
  const tenantIdParam = url.searchParams.get("tenantId");
  const manage = url.searchParams.get("manage") === "true";

  try {
    await expireStalePendingReservations();
  } catch (dbError) {
    console.warn("No pudimos vencer reservas pendientes:", dbError);
  }

  try {
    const courtsFromDb = await prisma.court.findMany({
      where:
        manage && tenantIdParam
        ? {
          id_tenant: Number(tenantIdParam),
          }
          : {
          is_active: true,
          },
        include: {
        reservations: {
        where: date ? { date: new Date(date) } : undefined,
        include: {
          payments: { include: { estado: true } },
          user: { select: { full_name: true, nickname: true, email: true } },
        },
      },
      rates: true,
      },
    });

    if (courtsFromDb.length > 0) {
      const courts = courtsFromDb
  .filter((court: (typeof courtsFromDb)[number]) => {
          if (surface && surface !== "all" && court.surface !== surface) return false;
          return true;
        })
        .map((court) => {
          const now = Date.now();
          const reservedSlots = new Set(
            court.reservations
              .filter(
                (r) =>
                  r.status === "confirmada" ||
                  (r.status === "pendiente" && (!r.hold_expires_at || r.hold_expires_at.getTime() > now)),
              )
              .map((r) => utcDateToSlot(r.start_time)),
          );

          const availableSlots = DEFAULT_SLOTS.filter(
            (slot) => slotMatchesTimeRange(slot, timeSlot ?? "all") && !reservedSlots.has(slot),
          );

          const reservations = court.reservations
            .filter((r) => (userId ? r.id_user === Number(userId) : true))
            .map((r) => {
              const payment = r.payments[0];
              return {
                id: r.id_reservation,
                userId: r.id_user,
                courtId: r.id_court,
                date: r.date.toISOString().slice(0, 10),
                timeSlot: utcDateToSlot(r.start_time),
                status: r.status as "pendiente" | "confirmada" | "rechazada" | "cancelada",
                createdAt: r.created_at.toISOString(),
                paymentMethod: payment?.payment_method ?? null,
                paymentStatus: payment?.estado.name ?? null,
                amount: payment ? Number(payment.amount) : null,
                playerName: r.user.nickname || r.user.full_name,
                playerEmail: r.user.email,
                teamId: r.id_team,
                rivalTeamId: r.id_rival_team,
                matchClosed: r.match_closed_at != null,
              };
            });

          const nightRate = resolveNightRate(
            court.rates.map((rate) => ({
              id_rate: rate.id_rate,
              id_court: rate.id_court,
              schedule_type: rate.schedule_type,
              amount: Number(rate.amount),
              priority: rate.priority,
            })),
          );

          return {
            id: court.id_court,
            tenantId: court.id_tenant,
            name: court.name,
            location: court.address ?? "Ubicación no disponible",
            mapsUrl: court.maps_url ?? null,
            surface: court.surface as "synthetic" | "natural" | "indoor",
            capacity: court.capacity,
            pricePerHour: Number(court.price_per_hour),
            pricePerHourNight: nightRate ? nightRate.amount : null,
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

const PAYMENT_METHODS = ["sinpe", "efectivo", "mixto"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  sinpe: "SINPE Móvil",
  efectivo: "efectivo",
  mixto: "SINPE + efectivo",
};

export async function POST(request: NextRequest) {
  try {
    await ensureTeamsHydrated();
    const body = await request.json();
    const userId = Number(body?.userId);
    const courtId = Number(body?.courtId);
    const date = String(body?.date ?? "");
    const timeSlot = String(body?.timeSlot ?? "");
    const rawPaymentMethod = body?.paymentMethod;
    const paymentMethod = isPaymentMethod(rawPaymentMethod) ? rawPaymentMethod : null;
    const teamId = body?.teamId ? Number(body.teamId) : null;
    const splitPayment = Boolean(body?.splitPayment);
    const rivalTeamId = body?.rivalTeamId ? Number(body.rivalTeamId) : null;

    if (!userId || !courtId || !date || !timeSlot) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos para procesar la reserva" },
        { status: 400 },
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { ok: false, error: "Selecciona un método de pago (SINPE o efectivo)" },
        { status: 400 },
      );
    }

    const startDateTime = parseSlotTime(date, timeSlot);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    const dateOnly = new Date(`${date}T00:00:00.000Z`);

    try {
      const [courtExists, userExists, pendienteEstado] = await Promise.all([
        prisma.court.findUnique({ where: { id_court: courtId }, include: { rates: true } }),
        prisma.user.findUnique({ where: { id_user: userId } }),
        prisma.estado.findUniqueOrThrow({ where: { name: "pendiente" } }),
      ]);

      if (!courtExists || !userExists) {
        return NextResponse.json(
          { ok: false, error: "No encontramos la cancha o el usuario indicado" },
          { status: 404 },
        );
      }

      {
        const [hourPart] = timeSlot.split(":");
        const nightRate = isNightHour(Number(hourPart))
          ? resolveNightRate(
              courtExists.rates.map(
                (rate): RateCandidate => ({
                  id_rate: rate.id_rate,
                  id_court: rate.id_court,
                  schedule_type: rate.schedule_type,
                  amount: Number(rate.amount),
                  priority: rate.priority,
                }),
              ),
            )
          : null;
        const amount = nightRate ? nightRate.amount : Number(courtExists.price_per_hour ?? 0);

        const outcome = await prisma.$transaction(async (tx) => {
          // Bloquea la fila de la cancha para serializar cualquier intento
          // concurrente de reservar el mismo horario (evita el double-booking).
          await tx.$executeRaw`SELECT id_court FROM court WHERE id_court = ${courtId} FOR UPDATE`;

          const conflict = await tx.reservation.findFirst({
            where: activeSlotWhere(courtId, dateOnly, startDateTime),
          });

          if (conflict) {
            return { conflict: true as const };
          }

          const reservation = await tx.reservation.create({
            data: {
              id_court: courtId,
              id_user: userId,
              id_rate: nightRate?.id_rate ?? null,
              date: dateOnly,
              start_time: startDateTime,
              end_time: endDateTime,
              status: "pendiente",
              hold_expires_at: new Date(Date.now() + HOLD_DURATION_MS),
              id_team: teamId,
              id_rival_team: rivalTeamId,
            },
          });

          const payment = await tx.payment.create({
            data: {
              id_reservation: reservation.id_reservation,
              amount,
              payment_method: paymentMethod,
              id_estado: pendienteEstado.id_estado,
            },
          });

          return { conflict: false as const, reservation, payment };
        });

        if (outcome.conflict) {
          const laterSlots = DEFAULT_SLOTS.filter((s) => s > timeSlot);
          let suggestedSlot: string | null = null;
          for (const slot of laterSlots) {
            const sStart = parseSlotTime(date, slot);
            const taken = await prisma.reservation.findFirst({
              where: activeSlotWhere(courtId, dateOnly, sStart),
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

        const { reservation, payment } = outcome;

        if (userExists.notifications_enabled) {
          const paymentLabel = PAYMENT_METHOD_LABELS[paymentMethod];
          const message = `Reserva en ${courtExists.name} a las ${timeSlot} pendiente de confirmación de pago (${paymentLabel}) por el dueño de la cancha.`;
          await prisma.notification.create({
            data: { id_user: userId, type: "reservation", message },
          });
          notifyPush(userId, message);
        }

        const tenant = await prisma.user.findUnique({ where: { id_user: courtExists.id_tenant } });
        if (tenant?.notifications_enabled) {
          const paymentLabel = PAYMENT_METHOD_LABELS[paymentMethod];
          const message = `Nueva reserva en ${courtExists.name} el ${date} a las ${timeSlot}. Verifica el pago por ${paymentLabel} (₡${Number(amount)}) para confirmarla.`;
          await prisma.notification.create({
            data: { id_user: tenant.id_user, type: "payment-pending", message },
          });
          notifyPush(tenant.id_user, message);
        }

        // La plantilla y las notificaciones de pago dividido / invitación viven en el
        // store en memoria (igual que /api/teams y /api/notifications), así que se
        // notifican ahí sin importar si la reserva en sí se guardó en Prisma o no.
        if (teamId && splitPayment) {
          const team = getTeamById(teamId);
          if (team) {
            const perPerson = (Number(amount) / Math.max(1, team.playerIds.length)).toFixed(2);
            await notifyTeamMembers({
              teamId,
              excludeUserId: userId,
              type: "payment-split",
              message: () =>
                `${userExists.full_name} reservó ${courtExists.name} el ${date} a las ${timeSlot}. Tu parte del pago: ₡${perPerson}.`,
            });
          }
        }

        if (rivalTeamId) {
          await notifyTeamCaptain({
            teamId: rivalTeamId,
            type: "match-invite",
            message: `${userExists.full_name} te invita a jugar en ${courtExists.name} el ${date} a las ${timeSlot}.`,
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
              paymentMethod: payment.payment_method,
              paymentStatus: pendienteEstado.name,
              amount: Number(payment.amount),
            },
          },
          { status: 201 },
        );
      }
    } catch (dbError) {
      // Antes esto caía en un fallback silencioso al store en memoria: la
      // reserva "se creaba" ahí, pero como el GET siempre lee de Postgres
      // (que sí responde normalmente), quedaba invisible para siempre tanto
      // para el jugador como para el dueño de la cancha. Mejor devolver el
      // error real para que el usuario reintente.
      console.error("Reserve court failed:", dbError);
      return NextResponse.json(
        { ok: false, error: "No pudimos procesar la reserva. Intenta de nuevo." },
        { status: 503 },
      );
    }
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

      if (!reservation) {
        return NextResponse.json(
          { ok: false, error: "No encontramos la reserva solicitada" },
          { status: 404 },
        );
      }

      if (reservation.id_user !== userId) {
        return NextResponse.json(
          { ok: false, error: "No encontramos la reserva solicitada" },
          { status: 409 },
        );
      }

      if (reservation.match_closed_at) {
        return NextResponse.json(
          { ok: false, error: "Esta reserva ya fue pagada y cerrada, no se puede cancelar" },
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
        data: { status: "cancelada" },
      });

      const notifications = [];
      if (reservation.user?.notifications_enabled) {
        const message = `Cancelamos tu reserva en ${reservation.court?.name ?? "la cancha"} para ${updated.date.toISOString().slice(0, 10)}.`;
        const notif = await prisma.notification.create({
          data: { id_user: userId, type: "cancellation", message },
        });
        notifications.push(notif);
        notifyPush(userId, message);
      }

      return NextResponse.json({
        ok: true,
        reservation: {
          id: updated.id_reservation,
          userId: updated.id_user,
          courtId: updated.id_court,
          date: updated.date.toISOString().slice(0, 10),
          timeSlot: utcDateToSlot(updated.start_time),
          status: updated.status,
          createdAt: updated.created_at.toISOString(),
        },
        notifications,
      });
    } catch (dbError) {
      // Ver nota en POST: un fallback silencioso al store en memoria dejaba
      // la cancelación invisible para el dueño de la cancha. Se propaga el
      // error real en su lugar.
      console.error("Cancel reservation failed:", dbError);
      return NextResponse.json(
        { ok: false, error: "No pudimos cancelar la reserva. Intenta de nuevo." },
        { status: 503 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos cancelar la reserva" },
      { status: 500 },
    );
  }
}

// El dueño de la cancha (tenant) confirma o rechaza el pago declarado por el
// jugador. Solo entonces la reserva pasa de "pendiente" a su estado final.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const reservationId = Number(body?.reservationId);
    const tenantId = Number(body?.tenantId);
    const action = String(body?.action ?? "");
    const rejectionReason = body?.reason ? String(body.reason) : null;

    if (!reservationId || !tenantId || (action !== "confirm" && action !== "reject")) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos para procesar la verificación del pago" },
        { status: 400 },
      );
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { ok: false, error: "Indica el motivo del rechazo" },
        { status: 400 },
      );
    }

    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id_reservation: reservationId },
        include: { court: true, user: true, payments: { include: { estado: true } } },
      });

      if (!reservation) {
        return NextResponse.json(
          { ok: false, error: "No encontramos la reserva solicitada" },
          { status: 404 },
        );
      }

      if (reservation.court.id_tenant !== tenantId) {
        return NextResponse.json(
          { ok: false, error: "Esta reserva no pertenece a una de tus canchas" },
          { status: 403 },
        );
      }

      if (reservation.status !== "pendiente") {
        return NextResponse.json(
          { ok: false, error: "Esta reserva ya fue procesada" },
          { status: 409 },
        );
      }

      const payment = reservation.payments[0];
      if (!payment) {
        return NextResponse.json({ ok: false, error: "No encontramos el pago asociado" }, { status: 404 });
      }

      const nuevoEstado = await prisma.estado.findUniqueOrThrow({
        where: { name: action === "confirm" ? "verificado" : "rechazado" },
      });

      const [updatedReservation, updatedPayment] = await prisma.$transaction([
        prisma.reservation.update({
          where: { id_reservation: reservationId },
          data: { status: action === "confirm" ? "confirmada" : "rechazada" },
        }),
        prisma.payment.update({
          where: { id_payment: payment.id_payment },
          data: {
            id_estado: nuevoEstado.id_estado,
            id_verified_by: tenantId,
            verified_at: new Date(),
            rejection_reason: action === "reject" ? rejectionReason : null,
          },
        }),
        // Auditoría: registra quién verificó/rechazó el pago y por qué.
        prisma.estadoHistorial.create({
          data: {
            entidad: "payment",
            id_entidad: payment.id_payment,
            id_estado_previo: payment.id_estado,
            id_estado_nuevo: nuevoEstado.id_estado,
            id_changed_by: tenantId,
            reason: action === "reject" ? rejectionReason : null,
          },
        }),
      ]);

      if (reservation.user.notifications_enabled) {
        const timeSlot = utcDateToSlot(reservation.start_time);
        const message =
          action === "confirm"
            ? `¡Pago verificado! Tu reserva en ${reservation.court.name} el ${reservation.date.toISOString().slice(0, 10)} a las ${timeSlot} quedó confirmada.`
            : `Tu reserva en ${reservation.court.name} el ${reservation.date.toISOString().slice(0, 10)} a las ${timeSlot} fue rechazada: ${rejectionReason}.`;

        await prisma.notification.create({
          data: {
            id_user: reservation.id_user,
            type: action === "confirm" ? "reservation" : "cancellation",
            message,
          },
        });
        notifyPush(reservation.id_user, message);
      }

      return NextResponse.json({
        ok: true,
        reservation: {
          id: updatedReservation.id_reservation,
          status: updatedReservation.status,
        },
        payment: {
          id: updatedPayment.id_payment,
          status: nuevoEstado.name,
          rejectionReason: updatedPayment.rejection_reason,
        },
      });
    } catch (dbError) {
      // Ver nota en POST: un fallback silencioso al store en memoria dejaba
      // la confirmación/rechazo sin efecto real, porque la reserva vivía en
      // Postgres y el store en memoria no la conocía. Se propaga el error.
      console.error("Verify payment failed:", dbError);
      return NextResponse.json(
        { ok: false, error: "No pudimos verificar el pago. Intenta de nuevo." },
        { status: 503 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos verificar el pago" },
      { status: 500 },
    );
  }
}
