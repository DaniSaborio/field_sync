"use client";

import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookingPanel } from "./booking-panel";

export function GuestBookingScreen({ onRequireLogin }: { onRequireLogin: () => void }) {
  return (
    <div className="min-h-screen bg-paper font-sans">
      <header className="border-b border-black bg-paper px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center bg-black px-1.5 py-px font-mono text-[10px] font-bold uppercase tracking-wider text-paper">
              Explorando como invitado
            </span>
            <h1 className="mt-3 font-display text-3xl font-black leading-none tracking-tight text-black sm:text-4xl">
              Reserva tu cancha
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Mirá la disponibilidad en tiempo real. Iniciá sesión para confirmar una reserva.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={onRequireLogin}
            className="self-start lg:self-auto"
          >
            <LogIn size={14} aria-hidden />
            Iniciar sesión
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <BookingPanel user={null} onRequireLogin={onRequireLogin} />
      </div>
    </div>
  );
}
