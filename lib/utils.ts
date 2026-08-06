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
