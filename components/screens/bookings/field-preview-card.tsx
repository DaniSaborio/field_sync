import { BadgeCheck, CircleDollarSign, Clock3, MapPin, Moon, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { RowTag } from "@/components/ui/row";
import { isNightSlot } from "@/lib/utils";

export type FieldPreview = {
  id: string;
  name: string;
  location: string;
  surface: "synthetic" | "natural" | "indoor";
  capacity: string;
  pricePerHour: number;
  pricePerHourNight: number | null;
  availableSlots: string[];
  rating: number;
};

type FieldPreviewCardProps = {
  field: FieldPreview;
};

const surfaceLabel: Record<FieldPreview["surface"], string> = {
  synthetic: "Sintética",
  natural: "Natural",
  indoor: "Indoor",
};

export function FieldPreviewCard({ field }: FieldPreviewCardProps) {
  const hasNightSlots = field.availableSlots.some(isNightSlot);

  return (
    <Card className="gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-black leading-tight tracking-tight text-black">
            {field.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
            <MapPin size={12} strokeWidth={2} aria-hidden />
            {field.location}
          </p>
        </div>

        <RowTag className="inline-flex shrink-0 items-center gap-1">
          <BadgeCheck size={12} strokeWidth={2} aria-hidden />
          {field.rating.toFixed(1)}
        </RowTag>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
        <span className="flex items-center gap-1.5">
          <Users size={13} strokeWidth={2} aria-hidden />
          {field.capacity}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 size={13} strokeWidth={2} aria-hidden />
          {field.availableSlots.length} horarios
        </span>
        <RowTag>{surfaceLabel[field.surface]}</RowTag>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {field.availableSlots.map((slot) => {
          const isNight = isNightSlot(slot);
          return (
            <RowTag
              key={`${field.id}-${slot}`}
              tone={isNight ? "night" : "positive"}
              className={isNight ? "inline-flex items-center gap-1" : undefined}
            >
              {isNight ? <Moon size={10} strokeWidth={2.5} aria-hidden /> : null}
              {slot}
            </RowTag>
          );
        })}
      </div>

      {hasNightSlots ? (
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          <Moon size={12} strokeWidth={2} className="text-night" aria-hidden />
          {field.pricePerHourNight != null
            ? `Horario nocturno a $${field.pricePerHourNight}/h`
            : "Horario nocturno con tarifa más alta"}
        </p>
      ) : null}

      <CardFooter className="justify-between">
        <p className="flex items-baseline gap-1 font-mono text-black">
          <CircleDollarSign size={14} strokeWidth={2} className="mb-0.5" aria-hidden />
          <span className="text-xl font-black">${field.pricePerHour}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            / hora
          </span>
        </p>

        <Button size="sm">Ver detalles</Button>
      </CardFooter>
    </Card>
  );
}
