"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarX, TriangleAlert } from "lucide-react";

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
    hasLights: boolean;
    capacity: string;
    pricePerHour: number;
    pricePerHourNight: number | null;
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
        hasLights: court.hasLights,
        capacity: court.capacity,
        pricePerHour: court.pricePerHour,
        pricePerHourNight: court.pricePerHourNight,
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
    <div className="min-h-screen bg-paper pb-16 font-sans">
      <BookingsHeader
        onLogout={onLogout}
        availableCount={visibleFields.length}
        totalCount={courts.length}
      />

      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6">
        <AvailabilityFilters
          date={date}
          timeSlot={timeSlot}
          surface={surface}
          onDateChange={setDate}
          onTimeSlotChange={setTimeSlot}
          onSurfaceChange={setSurface}
        />

        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {isLoading ? "Consultando disponibilidad…" : `${visibleFields.length} canchas disponibles`}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {date ? `Fecha: ${date}` : "Sin fecha seleccionada"}
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-6 flex items-center gap-2 border border-black bg-black px-4 py-3 font-mono text-xs uppercase tracking-wider text-paper"
          >
            <TriangleAlert size={16} strokeWidth={2} aria-hidden />
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="border border-black bg-paper p-10 text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-black">
              Cargando…
            </p>
          </div>
        ) : visibleFields.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleFields.map((field) => (
              <FieldPreviewCard key={field.id} field={field} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 border border-black bg-paper p-10 text-center">
            <CalendarX size={40} strokeWidth={1.5} className="text-black" aria-hidden />
            <p className="font-display text-xl font-black text-black">
              Sin canchas disponibles
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Probá otra franja horaria o superficie
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
