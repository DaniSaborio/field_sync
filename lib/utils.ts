import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Un horario se considera nocturno desde las 18:00 (misma frontera que el
// filtro "Noche" en /api/courts y en los selectores de franja horaria).
export function isNightHour(hour: number) {
  return hour >= 18;
}

export function isNightSlot(slot: string) {
  const [hourPart] = slot.split(":");
  return isNightHour(Number(hourPart));
}

// Costa Rica no observa horario de verano: el offset UTC-6 es fijo todo el año.
const COSTA_RICA_UTC_OFFSET_HOURS = 6;

// Convierte una fecha + franja en hora local de Costa Rica ("2026-08-12",
// "20:00") al instante UTC real que representa (20:00 CR = 02:00 UTC del día
// siguiente). Guardar la hora sin este ajuste hacía que reservas nocturnas
// parecieran "ya pasadas" apenas se creaban (la hora UTC del reloj real ya es
// mayor que la hora literal de la franja durante buena parte del día).
export function slotToUtcDate(dateIso: string, slot: string): Date {
  const [h, m] = slot.split(":").map(Number);
  const d = new Date(`${dateIso}T00:00:00.000Z`);
  d.setUTCHours(h + COSTA_RICA_UTC_OFFSET_HOURS, m ?? 0, 0, 0);
  return d;
}

// Inversa de slotToUtcDate: recupera la franja "HH:MM" en hora de Costa Rica
// a partir de un instante UTC guardado con slotToUtcDate.
export function utcDateToSlot(date: Date): string {
  const crShifted = new Date(date.getTime() - COSTA_RICA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const h = crShifted.getUTCHours().toString().padStart(2, "0");
  const m = crShifted.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}
