"use client";

import { useMemo, useState } from "react";
import { AvailabilityFilters } from "./bookings/availability-filters";
import { BookingsHeader } from "./bookings/bookings-header";
import { FieldPreviewCard, type FieldPreview } from "./bookings/field-preview-card";

type BookingsScreenProps = {
  onLogout: () => void;
};

const mockFields: FieldPreview[] = [
  {
    id: "field-1",
    name: "Complejo Norte - Cancha A",
    location: "Av. Central 1420",
    surface: "synthetic",
    capacity: "5 vs 5",
    pricePerHour: 55,
    availableSlots: ["08:00", "09:30", "18:00", "20:00"],
    rating: 4.8,
  },
  {
    id: "field-2",
    name: "Estadio Barrial - Cancha 2",
    location: "Calle 25 #430",
    surface: "natural",
    capacity: "7 vs 7",
    pricePerHour: 68,
    availableSlots: ["11:00", "13:00", "17:30"],
    rating: 4.6,
  },
  {
    id: "field-3",
    name: "Arena Indoor Center",
    location: "Boulevard Sur 990",
    surface: "indoor",
    capacity: "6 vs 6",
    pricePerHour: 72,
    availableSlots: ["09:00", "15:00", "19:00", "21:00"],
    rating: 4.9,
  },
  {
    id: "field-4",
    name: "Canchas del Lago - C",
    location: "Ruta 3 km 5",
    surface: "synthetic",
    capacity: "8 vs 8",
    pricePerHour: 64,
    availableSlots: ["10:30", "12:00", "16:30"],
    rating: 4.5,
  },
];

function slotMatchesTimeRange(slot: string, timeSlot: string) {
  if (timeSlot === "all") {
    return true;
  }

  const [hourPart] = slot.split(":");
  const hour = Number(hourPart);

  if (timeSlot === "morning") {
    return hour < 12;
  }

  if (timeSlot === "afternoon") {
    return hour >= 12 && hour < 18;
  }

  return hour >= 18;
}

export function BookingsScreen({ onLogout }: BookingsScreenProps) {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("all");
  const [surface, setSurface] = useState("all");

  const visibleFields = useMemo(() => {
    return mockFields
      .map((field) => ({
        ...field,
        availableSlots: field.availableSlots.filter((slot) =>
          slotMatchesTimeRange(slot, timeSlot),
        ),
      }))
      .filter((field) => {
        if (surface !== "all" && field.surface !== surface) {
          return false;
        }

        return field.availableSlots.length > 0;
      });
  }, [surface, timeSlot]);

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,#0a1628_0%,#080e1a_100%)] px-4 py-8 sm:px-6 lg:px-8"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <BookingsHeader onLogout={onLogout} />

        <AvailabilityFilters
          date={date}
          timeSlot={timeSlot}
          surface={surface}
          onDateChange={setDate}
          onTimeSlotChange={setTimeSlot}
          onSurfaceChange={setSurface}
        />

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-300">
            {visibleFields.length} canchas disponibles
          </p>
          <p className="text-xs text-slate-500">
            {date ? `Fecha seleccionada: ${date}` : "Sin fecha seleccionada"}
          </p>
        </div>

        {visibleFields.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleFields.map((field) => (
              <FieldPreviewCard key={field.id} field={field} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center">
            <p className="text-lg font-semibold text-slate-200">
              No hay canchas para esos filtros
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Prueba otra franja horaria o tipo de superficie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
