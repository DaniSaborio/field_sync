import { prisma } from "@/lib/prisma";
import { isSlotInPast, utcDateToSlot } from "@/lib/utils";
import { resolveRateForSchedule, SCHEDULE_TYPES, type RateCandidate, type ScheduleType } from "@/lib/rates";
import { expireStalePendingReservations } from "@/lib/reservation-expiry";

// Slots de 30 minutos, de 8:00 a 21:00. El último es 20:30-21:00, la última
// hora del día.
export const DEFAULT_SLOTS = [
  "08:00", "09:00", "09:30", "10:30", "11:00", "12:00",
  "13:00", "15:00", "16:30", "17:30", "18:00", "19:00", "20:00", "21:00", "22:00",
];

export function slotMatchesTimeRange(slot: string, timeSlot: string) {
  if (!timeSlot || timeSlot === "all") return true;
  const [hourPart] = slot.split(":");
  const hour = Number(hourPart);
  if (timeSlot === "morning") return hour < 12;
  if (timeSlot === "afternoon") return hour >= 12 && hour < 18;
  if (timeSlot === "night") return hour >= 18;
  return true;
}

// Una franja está ocupada si tiene una reserva "confirmada", o una
// "pendiente" cuyo hold no venció todavía (mientras el dueño no confirma el
// pago).
export function activeSlotWhere(courtId: number, date: Date, startTime: Date) {
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

export async function listCourts(filters: {
  date?: string;
  timeSlot?: string;
  surface?: string;
  userId?: number;
  hasLights?: boolean;
  manage?: boolean;
  tenantId?: number;
}) {
  try {
    await expireStalePendingReservations();
  } catch (dbError) {
    console.warn("No pudimos vencer reservas pendientes:", dbError);
  }

  const courtsFromDb = await prisma.court.findMany({
    where:
      filters.manage && filters.tenantId
        ? { id_tenant: filters.tenantId }
        : { is_active: true },
    include: {
      reservations: {
        where: filters.date ? { date: new Date(filters.date) } : undefined,
        include: {
          payments: { include: { estado: true } },
          user: { select: { full_name: true, nickname: true, email: true } },
        },
      },
      rates: true,
    },
  });

  if (courtsFromDb.length === 0) {
    return [];
  }

  return courtsFromDb
    .filter((court) => {
      if (filters.surface && filters.surface !== "all" && court.surface !== filters.surface) return false;
      if (filters.hasLights !== undefined && court.has_light !== filters.hasLights) return false;
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
        (slot) =>
          slotMatchesTimeRange(slot, filters.timeSlot ?? "all") &&
          !reservedSlots.has(slot) &&
          !(filters.date && isSlotInPast(filters.date, slot)),
      );

      const reservations = court.reservations
        .filter((r) => (filters.userId ? r.id_user === filters.userId : true))
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

      const rateCandidates: RateCandidate[] = court.rates.map((rate) => ({
        id_rate: rate.id_rate,
        id_court: rate.id_court,
        schedule_type: rate.schedule_type,
        amount: Number(rate.amount),
        priority: rate.priority,
      }));
      const nightRate = resolveRateForSchedule(rateCandidates, "night");
      const ratesBySchedule = Object.fromEntries(
        SCHEDULE_TYPES.map((type) => [type, resolveRateForSchedule(rateCandidates, type)?.amount ?? null]),
      ) as Record<ScheduleType, number | null>;

      return {
        id: court.id_court,
        tenantId: court.id_tenant,
        name: court.name,
        location: court.address ?? "Ubicación no disponible",
        mapsUrl: court.maps_url ?? null,
        hasLights: court.has_light,
        surface: court.surface as "synthetic" | "natural" | "indoor",
        capacity: court.capacity,
        pricePerHour: Number(court.price_per_hour),
        pricePerHourNight: nightRate ? nightRate.amount : null,
        rates: ratesBySchedule,
        rating: Number(court.rating),
        availableSlots,
        reservations,
      };
    })
    .filter((court) => court.availableSlots.length > 0 || court.reservations.length > 0);
}
