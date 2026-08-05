import { LogOut, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

type BookingsHeaderProps = {
  onLogout: () => void;
  availableCount: number;
  totalCount: number;
};

export function BookingsHeader({
  onLogout,
  availableCount,
  totalCount,
}: BookingsHeaderProps) {
  const availability = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-black bg-paper px-4 pb-4 pt-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 bg-black px-1.5 py-px font-mono text-[10px] font-bold uppercase tracking-wider text-paper">
            <MapPin size={12} strokeWidth={2} aria-hidden />
            Canchas disponibles
          </span>

          <Button variant="secondary" size="sm" onClick={onLogout}>
            <LogOut size={14} aria-hidden />
            Cerrar sesión
          </Button>
        </div>

        <div>
          <div className="flex items-end justify-between gap-3">
            <h1 className="font-display text-3xl font-black leading-none tracking-tight text-black sm:text-4xl">
              Reserva tu cancha
            </h1>
            <span className="shrink-0 font-mono text-2xl font-black tabular-nums text-black">
              {availableCount}/{totalCount}
            </span>
          </div>
          <p className="mt-2 max-w-md font-sans text-sm leading-relaxed text-muted">
            Explorá horarios libres y compará precios antes de reservar.
          </p>
        </div>

        <div>
          <ProgressBar value={availability} />
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
            Disponibilidad · {availability}%
          </p>
        </div>
      </div>
    </header>
  );
}
