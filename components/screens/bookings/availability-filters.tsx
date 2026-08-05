import { CalendarDays, ChevronDown, Clock3, Filter } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

type AvailabilityFiltersProps = {
  date: string;
  timeSlot: string;
  surface: string;
  onDateChange: (value: string) => void;
  onTimeSlotChange: (value: string) => void;
  onSurfaceChange: (value: string) => void;
};

const fieldClassName =
  "h-11 w-full appearance-none border border-black bg-paper px-3 text-sm font-medium text-black outline-none focus:outline focus:outline-2 focus:outline-black focus:outline-offset-2";

const labelClassName =
  "flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted";

export function AvailabilityFilters({
  date,
  timeSlot,
  surface,
  onDateChange,
  onTimeSlotChange,
  onSurfaceChange,
}: AvailabilityFiltersProps) {
  return (
    <section className="mb-8">
      <SectionLabel icon={Filter} className="mb-3">
        Filtrar disponibilidad
      </SectionLabel>

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block space-y-1.5">
            <span className={labelClassName}>
              <CalendarDays size={13} strokeWidth={2} aria-hidden />
              Fecha
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className={fieldClassName}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClassName}>
              <Clock3 size={13} strokeWidth={2} aria-hidden />
              Franja horaria
            </span>
            <div className="relative">
              <select
                value={timeSlot}
                onChange={(event) => onTimeSlotChange(event.target.value)}
                className={fieldClassName}
              >
                <option value="all">Todo el día</option>
                <option value="morning">Mañana</option>
                <option value="afternoon">Tarde</option>
                <option value="night">Noche</option>
              </select>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black"
                aria-hidden
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className={labelClassName}>Tipo de superficie</span>
            <div className="relative">
              <select
                value={surface}
                onChange={(event) => onSurfaceChange(event.target.value)}
                className={fieldClassName}
              >
                <option value="all">Todas</option>
                <option value="synthetic">Sintética</option>
                <option value="natural">Natural</option>
                <option value="indoor">Indoor</option>
              </select>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black"
                aria-hidden
              />
            </div>
          </label>
        </div>
      </Card>
    </section>
  );
}
