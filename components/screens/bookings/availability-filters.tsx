import { CalendarDays, Clock3, Filter } from "lucide-react";

type AvailabilityFiltersProps = {
  date: string;
  timeSlot: string;
  surface: string;
  onDateChange: (value: string) => void;
  onTimeSlotChange: (value: string) => void;
  onSurfaceChange: (value: string) => void;
};

export function AvailabilityFilters({
  date,
  timeSlot,
  surface,
  onDateChange,
  onTimeSlotChange,
  onSurfaceChange,
}: AvailabilityFiltersProps) {
  const inputClassName =
    "h-12 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10";

  return (
    <section className="mb-10 rounded-2xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-sm sm:p-7">
      <div className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-slate-400">
        <Filter size={14} />
        FILTRAR DISPONIBILIDAD
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <label className="block space-y-2.5">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
            <CalendarDays size={14} />
            Fecha
          </span>
          <input
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block space-y-2.5">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Clock3 size={14} />
            Franja horaria
          </span>
          <select
            value={timeSlot}
            onChange={(event) => onTimeSlotChange(event.target.value)}
            className={inputClassName}
          >
            <option value="all">Todo el día</option>
            <option value="morning">Mañana</option>
            <option value="afternoon">Tarde</option>
            <option value="night">Noche</option>
          </select>
        </label>

        <label className="block space-y-2.5">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
            Tipo de superficie
          </span>
          <select
            value={surface}
            onChange={(event) => onSurfaceChange(event.target.value)}
            className={inputClassName}
          >
            <option value="all">Todas</option>
            <option value="synthetic">Sintética</option>
            <option value="natural">Natural</option>
            <option value="indoor">Indoor</option>
          </select>
        </label>
      </div>
    </section>
  );
}
