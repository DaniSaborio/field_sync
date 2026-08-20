import type { AppUser, CourtCard } from "./types";

export async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatShortDate(dateIso: string) {
  return new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "2-digit" }).format(new Date(`${dateIso}T00:00:00`));
}

export function surfaceLabel(surface: CourtCard["surface"]) {
  if (surface === "synthetic") return "Sintética";
  if (surface === "natural") return "Natural";
  return "Indoor";
}

export function humanRole(role: string) {
  switch (role) {
    case "administrador":
    case "admin_plataforma":
      return "Administrador";
    case "recepcionista":
      return "Recepcionista";
    case "organizador":
      return "Organizador";
    case "tenant":
      return "Dueño de cancha";
    default:
      return "Jugador";
  }
}

export function isAdmin(user: AppUser) {
  return user.role === "administrador" || user.role === "admin_plataforma";
}

export function isTenant(user: AppUser) {
  return user.role === "tenant";
}

// Muestra el apodo junto al nombre completo para diferenciar jugadores que comparten nombre.
export function displayName(person: { fullName: string; nickname?: string | null }) {
  return person.nickname ? `${person.fullName} "${person.nickname}"` : person.fullName;
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
