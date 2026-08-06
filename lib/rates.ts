export type RateCandidate = {
  id_rate: number;
  id_court: number | null;
  schedule_type: string;
  amount: number;
  priority: number;
};

export const NIGHT_SCHEDULE_TYPE = "night";

// Entre las tarifas "night" de un tenant, una cancha puede tener su propia
// tarifa (id_court != null) o heredar la tarifa por defecto del tenant
// (id_court null). La tarifa específica de la cancha siempre gana; entre
// tarifas igual de específicas, la de mayor `priority` gana.
export function resolveNightRate(rates: RateCandidate[]): RateCandidate | null {
  const nightRates = rates.filter((rate) => rate.schedule_type === NIGHT_SCHEDULE_TYPE);

  return nightRates.reduce<RateCandidate | null>((best, candidate) => {
    if (!best) return candidate;

    const candidateIsCourtSpecific = candidate.id_court !== null;
    const bestIsCourtSpecific = best.id_court !== null;
    if (candidateIsCourtSpecific !== bestIsCourtSpecific) {
      return candidateIsCourtSpecific ? candidate : best;
    }

    return candidate.priority > best.priority ? candidate : best;
  }, null);
}
