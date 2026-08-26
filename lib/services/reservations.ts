import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";
import { getTeamById, notifyTeamCaptain, notifyTeamMembers } from "@/lib/services/teams";
import { isSlotInPast, slotToUtcDate, utcDateToSlot } from "@/lib/utils";
import { resolveRateForHour, type RateCandidate } from "@/lib/rates";
import { DEFAULT_SLOTS, activeSlotWhere } from "@/lib/services/courts";

// La ventana durante la cual una reserva "pendiente" bloquea la franja para
// los demás mientras el dueño de la cancha no confirma el pago. Pasado este
// tiempo se considera vencida y la franja vuelve a quedar libre.
const HOLD_DURATION_MS = 30 * 60 * 1000;

const PAYMENT_METHODS = ["sinpe", "efectivo", "mixto"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  sinpe: "SINPE Móvil",
  efectivo: "efectivo",
  mixto: "SINPE + efectivo",
};

export async function createReservation(input: {
  userId: number;
  courtId: number;
  date: string;
  timeSlot: string;
  paymentMethod: PaymentMethod | null;
  teamId: number | null;
  splitPayment: boolean;
  rivalTeamId: number | null;
}) {
  if (!input.userId || !input.courtId || !input.date || !input.timeSlot) {
    return { ok: false as const, error: "Faltan datos para procesar la reserva", status: 400 as const };
  }

  const paymentMethod = input.paymentMethod;
  if (!paymentMethod) {
    return { ok: false as const, error: "Selecciona un método de pago (SINPE o efectivo)", status: 400 as const };
  }

  if (isSlotInPast(input.date, input.timeSlot)) {
    return { ok: false as const, error: "No podés reservar una fecha u hora que ya pasó", status: 400 as const };
  }

  const startDateTime = slotToUtcDate(input.date, input.timeSlot);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
  const dateOnly = new Date(`${input.date}T00:00:00.000Z`);

  const [courtExists, userExists, pendienteEstado] = await Promise.all([
    prisma.court.findUnique({
      where: { id_court: input.courtId },
      include: { rates: true, tenant: { include: { estado: true } } },
    }),
    prisma.user.findUnique({ where: { id_user: input.userId } }),
    prisma.estado.findUniqueOrThrow({ where: { name: "pendiente" } }),
  ]);

  if (!courtExists || !userExists) {
    return { ok: false as const, error: "No encontramos la cancha o el usuario indicado", status: 404 as const };
  }

  if (courtExists.tenant.estado.name === "suspendido") {
    return { ok: false as const, error: "Esta cancha pertenece a un dueño suspendido: no se puede reservar", status: 403 as const };
  }

  const [hourPart] = input.timeSlot.split(":");
  const matchedRate = resolveRateForHour(
    courtExists.rates.map(
      (rate): RateCandidate => ({
        id_rate: rate.id_rate,
        id_court: rate.id_court,
        schedule_type: rate.schedule_type,
        amount: Number(rate.amount),
        priority: rate.priority,
      }),
    ),
    Number(hourPart),
  );
  const amount = matchedRate ? matchedRate.amount : Number(courtExists.price_per_hour ?? 0);

  const outcome = await prisma.$transaction(async (tx) => {
    // Bloquea la fila de la cancha para serializar cualquier intento
    // concurrente de reservar la misma franja (evita el doble booking).
    await tx.$executeRaw`SELECT id_court FROM court WHERE id_court = ${input.courtId} FOR UPDATE`;

    const conflict = await tx.reservation.findFirst({
      where: activeSlotWhere(input.courtId, dateOnly, startDateTime),
    });

    if (conflict) {
      return { conflict: true as const };
    }

    const reservation = await tx.reservation.create({
      data: {
        id_court: input.courtId,
        id_user: input.userId,
        id_rate: matchedRate?.id_rate ?? null,
        date: dateOnly,
        start_time: startDateTime,
        end_time: endDateTime,
        status: "pendiente",
        hold_expires_at: new Date(Date.now() + HOLD_DURATION_MS),
        id_team: input.teamId,
        id_rival_team: input.rivalTeamId,
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
    const laterSlots = DEFAULT_SLOTS.filter((s) => s > input.timeSlot);
    let suggestedSlot: string | null = null;
    for (const slot of laterSlots) {
      const slotStart = slotToUtcDate(input.date, slot);
      const taken = await prisma.reservation.findFirst({
        where: activeSlotWhere(input.courtId, dateOnly, slotStart),
      });
      if (!taken) {
        suggestedSlot = slot;
        break;
      }
    }
    return { ok: false as const, error: "Franja no disponible", suggestedSlot, status: 409 as const };
  }

  const { reservation, payment } = outcome;
  const paymentLabel = PAYMENT_METHOD_LABELS[paymentMethod];

  await notifyUser(
    input.userId,
    userExists.notifications_enabled,
    "reservation",
    `Reserva en ${courtExists.name} a las ${input.timeSlot} pendiente de confirmación de pago (${paymentLabel}) por el dueño de la cancha.`,
  );

  await notifyUser(
    courtExists.tenant.id_user,
    courtExists.tenant.notifications_enabled,
    "payment-pending",
    `Nueva reserva en ${courtExists.name} el ${input.date} a las ${input.timeSlot}. Verifica el pago por ${paymentLabel} (₡${Number(amount)}) para confirmarla.`,
  );

  if (input.teamId && input.splitPayment) {
    const team = await getTeamById(input.teamId);
    if (team) {
      const perPerson = (Number(amount) / Math.max(1, team.playerIds.length)).toFixed(2);
      await notifyTeamMembers({
        teamId: input.teamId,
        excludeUserId: input.userId,
        type: "payment-split",
        message: () =>
          `${userExists.full_name} reservó ${courtExists.name} el ${input.date} a las ${input.timeSlot}. Tu parte del pago: ₡${perPerson}.`,
      });
    }
  }

  if (input.rivalTeamId) {
    await notifyTeamCaptain({
      teamId: input.rivalTeamId,
      type: "match-invite",
      message: `${userExists.full_name} te invita a jugar en ${courtExists.name} el ${input.date} a las ${input.timeSlot}.`,
    });
  }

  return {
    ok: true as const,
    reservation: {
      id: reservation.id_reservation,
      userId: reservation.id_user,
      courtId: reservation.id_court,
      date: input.date,
      timeSlot: input.timeSlot,
      status: reservation.status,
      createdAt: reservation.created_at.toISOString(),
      paymentMethod: payment.payment_method,
      paymentStatus: pendienteEstado.name,
      amount: Number(payment.amount),
    },
  };
}

export async function cancelReservation(input: { reservationId: number; userId: number; now?: Date }) {
  if (!input.reservationId || !input.userId) {
    return { ok: false as const, error: "Faltan datos para procesar la cancelación", status: 400 as const };
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id_reservation: input.reservationId },
    include: { court: true, user: true },
  });

  if (!reservation) {
    return { ok: false as const, error: "No encontramos la reserva solicitada", status: 404 as const };
  }

  if (reservation.id_user !== input.userId) {
    return { ok: false as const, error: "No encontramos la reserva solicitada", status: 409 as const };
  }

  if (reservation.match_closed_at) {
    return { ok: false as const, error: "Esta reserva ya fue pagada y cerrada, no se puede cancelar", status: 409 as const };
  }

  const now = input.now ?? new Date();
  const hoursDifference = (reservation.start_time.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDifference < 24) {
    return { ok: false as const, error: "No es posible cancelar con menos de 24 horas de anticipación", status: 409 as const };
  }

  const updated = await prisma.reservation.update({
    where: { id_reservation: input.reservationId },
    data: { status: "cancelada" },
  });

  await notifyUser(
    input.userId,
    reservation.user?.notifications_enabled ?? false,
    "cancellation",
    `Cancelamos tu reserva en ${reservation.court?.name ?? "la cancha"} para ${updated.date.toISOString().slice(0, 10)}.`,
  );

  return {
    ok: true as const,
    reservation: {
      id: updated.id_reservation,
      userId: updated.id_user,
      courtId: updated.id_court,
      date: updated.date.toISOString().slice(0, 10),
      timeSlot: utcDateToSlot(updated.start_time),
      status: updated.status,
      createdAt: updated.created_at.toISOString(),
    },
  };
}

// El dueño de la cancha (tenant) confirma o rechaza el pago declarado por el
// jugador. Solo entonces la reserva pasa de "pendiente" a su estado final.
export async function verifyPayment(input: {
  reservationId: number;
  tenantId: number;
  action: "confirm" | "reject";
  reason: string | null;
}) {
  if (!input.reservationId || !input.tenantId || (input.action !== "confirm" && input.action !== "reject")) {
    return { ok: false as const, error: "Faltan datos para procesar la verificación del pago", status: 400 as const };
  }

  if (input.action === "reject" && !input.reason) {
    return { ok: false as const, error: "Indica el motivo del rechazo", status: 400 as const };
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id_reservation: input.reservationId },
    include: { court: true, user: true, payments: { include: { estado: true } } },
  });

  if (!reservation) {
    return { ok: false as const, error: "No encontramos la reserva solicitada", status: 404 as const };
  }

  if (reservation.court.id_tenant !== input.tenantId) {
    return { ok: false as const, error: "Esta reserva no pertenece a una de tus canchas", status: 403 as const };
  }

  if (reservation.status !== "pendiente") {
    return { ok: false as const, error: "Esta reserva ya fue procesada", status: 409 as const };
  }

  const payment = reservation.payments[0];
  if (!payment) {
    return { ok: false as const, error: "No encontramos el pago asociado", status: 404 as const };
  }

  const nuevoEstado = await prisma.estado.findUniqueOrThrow({
    where: { name: input.action === "confirm" ? "verificado" : "rechazado" },
  });

  const [updatedReservation, updatedPayment] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id_reservation: input.reservationId },
      data: { status: input.action === "confirm" ? "confirmada" : "rechazada" },
    }),
    prisma.payment.update({
      where: { id_payment: payment.id_payment },
      data: {
        id_estado: nuevoEstado.id_estado,
        id_verified_by: input.tenantId,
        verified_at: new Date(),
        rejection_reason: input.action === "reject" ? input.reason : null,
      },
    }),
    // Auditoría: quién verificó/rechazó el pago y por qué.
    prisma.estadoHistorial.create({
      data: {
        entidad: "payment",
        id_entidad: payment.id_payment,
        id_estado_previo: payment.id_estado,
        id_estado_nuevo: nuevoEstado.id_estado,
        id_changed_by: input.tenantId,
        reason: input.action === "reject" ? input.reason : null,
      },
    }),
  ]);

  const timeSlot = utcDateToSlot(reservation.start_time);
  const message =
    input.action === "confirm"
      ? `¡Pago verificado! Tu reserva en ${reservation.court.name} el ${reservation.date.toISOString().slice(0, 10)} a las ${timeSlot} quedó confirmada.`
      : `Tu reserva en ${reservation.court.name} el ${reservation.date.toISOString().slice(0, 10)} a las ${timeSlot} fue rechazada: ${input.reason}.`;

  await notifyUser(
    reservation.id_user,
    reservation.user.notifications_enabled,
    input.action === "confirm" ? "reservation" : "cancellation",
    message,
  );

  return {
    ok: true as const,
    reservation: {
      id: updatedReservation.id_reservation,
      status: updatedReservation.status,
    },
    payment: {
      id: updatedPayment.id_payment,
      status: nuevoEstado.name,
      rejectionReason: updatedPayment.rejection_reason,
    },
  };
}
