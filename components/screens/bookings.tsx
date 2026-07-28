"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AvailabilityFilters } from "./bookings/availability-filters";
import { BookingsHeader } from "./bookings/bookings-header";
import { FieldPreviewCard, type FieldPreview } from "./bookings/field-preview-card";

type BookingsScreenProps = {
  onLogout: () => void;
  userId?: number;
};

type CourtApiResponse = {
  courts: Array<{
    id: number;
    name: string;
    location: string;
    surface: "synthetic" | "natural" | "indoor";
    capacity: string;
    pricePerHour: number;
    rating: number;
    availableSlots: string[];
  }>;
};

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

export function BookingsScreen({ onLogout, userId }: BookingsScreenProps) {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("all");
  const [surface, setSurface] = useState("all");
  const [courts, setCourts] = useState<FieldPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCourts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (timeSlot) params.set("timeSlot", timeSlot);
      if (surface) params.set("surface", surface);
      if (userId) params.set("userId", String(userId));

      const response = await fetch(`/api/courts?${params.toString()}`);
      if (!response.ok) {
        throw new Error("No pudimos cargar las canchas");
      }
      const payload = (await response.json()) as CourtApiResponse;
      const mapped: FieldPreview[] = payload.courts.map((court) => ({
        id: `field-${court.id}`,
        name: court.name,
        location: court.location,
        surface: court.surface,
        capacity: court.capacity,
        pricePerHour: court.pricePerHour,
        rating: court.rating,
        availableSlots: court.availableSlots,
      }));
      setCourts(mapped);
    } catch (error) {
      console.error("Failed to load courts:", error);
      setErrorMessage(error instanceof Error ? error.message : "No pudimos cargar las canchas");
    } finally {
      setIsLoading(false);
    }
  }, [date, timeSlot, surface, userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadCourts();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCourts]);

  const visibleFields = useMemo(() => {
    return courts
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
  }, [courts, surface, timeSlot]);

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
            {isLoading ? "Cargando canchas..." : `${visibleFields.length} canchas disponibles`}
          </p>
          <p className="text-xs text-slate-500">
            {date ? `Fecha seleccionada: ${date}` : "Sin fecha seleccionada"}
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-emerald-400" />
            <p className="text-sm text-slate-400">Consultando disponibilidad...</p>
          </div>
        ) : visibleFields.length > 0 ? (
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
