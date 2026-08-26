export type RateCandidate = {
  id_rate: number;
  id_court: number | null;
  schedule_type: string;
  amount: number;
  priority: number;
};

// Mismas franjas horarias que ya se usan como filtro en /api/courts
// (slotMatchesTimeRange) y en el selector de horario del cliente.
export const SCHEDULE_TYPES = ["morning", "afternoon", "night"] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const NIGHT_SCHEDULE_TYPE: ScheduleType = "night";

const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  night: "Noche",
};

export function scheduleTypeLabel(type: ScheduleType) {
  return SCHEDULE_TYPE_LABELS[type];
}

// Mismos límites que isNightHour en lib/utils.ts (noche desde las 18:00) y
// que slotMatchesTimeRange en /api/courts (tarde entre 12:00 y 18:00).
export function scheduleTypeForHour(hour: number): ScheduleType {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "night";
}

// Entre las tarifas de una misma franja horaria, una cancha puede tener su
// propia tarifa (id_court != null) o heredar la tarifa por defecto del
// tenant (id_court null). La tarifa específica de la cancha siempre gana;
// entre tarifas igual de específicas, la de mayor `priority` gana.
export function resolveRateForSchedule(rates: RateCandidate[], scheduleType: string): RateCandidate | null {
  const matching = rates.filter((rate) => rate.schedule_type === scheduleType);

  return matching.reduce<RateCandidate | null>((best, candidate) => {
    if (!best) return candidate;

    const candidateIsCourtSpecific = candidate.id_court !== null;
    const bestIsCourtSpecific = best.id_court !== null;
    if (candidateIsCourtSpecific !== bestIsCourtSpecific) {
      return candidateIsCourtSpecific ? candidate : best;
    }

    return candidate.priority > best.priority ? candidate : best;
  }, null);
}

export function resolveRateForHour(rates: RateCandidate[], hour: number): RateCandidate | null {
  return resolveRateForSchedule(rates, scheduleTypeForHour(hour));
}

export function resolveNightRate(rates: RateCandidate[]): RateCandidate | null {
  return resolveRateForSchedule(rates, NIGHT_SCHEDULE_TYPE);
}
