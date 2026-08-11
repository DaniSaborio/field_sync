import { prisma } from "./prisma";

const AUTO_CANCEL_REASON =
  "Vencida automáticamente: la hora de la reserva pasó sin confirmación de pago.";

function formatSlot(date: Date, startTime: Date) {
  const dateLabel = date.toISOString().slice(0, 10);
  const hour = startTime.getUTCHours().toString().padStart(2, "0");
  const minute = startTime.getUTCMinutes().toString().padStart(2, "0");
  return `${dateLabel} ${hour}:${minute}`;
}

// Reservas "pendiente" cuya hora ya pasó sin que el tenant confirmara el pago
// nunca se resuelven solas (a diferencia del hold de 30 min, que solo libera
// el horario para otros). Como no hay un cron job en este proyecto, se vencen
// de forma perezosa cada vez que alguien lee reservas/notificaciones.
export async function expireStalePendingReservations(now: Date = new Date()) {
  const stale = await prisma.reservation.findMany({
    where: { status: "pendiente", start_time: { lt: now } },
    include: {
      court: { include: { tenant: true } },
      user: true,
      payments: true,
    },
  });

  if (stale.length === 0) {
    return;
  }

  const rechazadoEstado = await prisma.estado.findUnique({ where: { name: "rechazado" } });

  for (const reservation of stale) {
    const payment = reservation.payments[0];

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id_reservation: reservation.id_reservation },
        data: { status: "cancelada" },
      });

      if (payment && rechazadoEstado) {
        await tx.payment.update({
          where: { id_payment: payment.id_payment },
          data: {
            id_estado: rechazadoEstado.id_estado,
            rejection_reason: AUTO_CANCEL_REASON,
          },
        });

        await tx.estadoHistorial.create({
          data: {
            entidad: "payment",
            id_entidad: payment.id_payment,
            id_estado_previo: payment.id_estado,
            id_estado_nuevo: rechazadoEstado.id_estado,
            id_changed_by: null,
            reason: AUTO_CANCEL_REASON,
          },
        });
      }
    });

    const slotLabel = formatSlot(reservation.date, reservation.start_time);

    if (reservation.user.notifications_enabled) {
      await prisma.notification.create({
        data: {
          id_user: reservation.id_user,
          type: "cancellation",
          message: `Tu reserva en ${reservation.court.name} para ${slotLabel} venció y se canceló automáticamente porque no se confirmó el pago a tiempo.`,
        },
      });
    }

    if (reservation.court.tenant.notifications_enabled) {
      await prisma.notification.create({
        data: {
          id_user: reservation.court.id_tenant,
          type: "cancellation",
          message: `La reserva pendiente en ${reservation.court.name} para ${slotLabel} venció sin confirmación de pago y se canceló automáticamente.`,
        },
      });
    }
  }
}
