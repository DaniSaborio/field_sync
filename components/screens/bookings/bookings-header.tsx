import { LogOut, MapPin } from "lucide-react";

type BookingsHeaderProps = {
  onLogout: () => void;
};

export function BookingsHeader({ onLogout }: BookingsHeaderProps) {
  return (
    <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-emerald-300">
          <MapPin size={13} />
          CANCHAS DISPONIBLES
        </p>
        <h1 className="text-3xl font-bold leading-tight text-slate-100 sm:text-4xl">
          Reserva tu próximo partido
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Explora horarios libres y compara precios antes de reservar.
        </p>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-slate-800 hover:text-slate-100"
      >
        <LogOut size={14} />
        Cerrar sesión
      </button>
    </header>
  );
}
