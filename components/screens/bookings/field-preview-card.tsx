import { BadgeCheck, CircleDollarSign, Clock3, MapPin, Users } from "lucide-react";

export type FieldPreview = {
  id: string;
  name: string;
  location: string;
  surface: "synthetic" | "natural" | "indoor";
  capacity: string;
  pricePerHour: number;
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
  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-6 transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-[0_12px_24px_rgba(16,185,129,0.12)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{field.name}</h3>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin size={13} />
            {field.location}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <BadgeCheck size={12} />
          {field.rating.toFixed(1)}
        </span>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Users size={13} className="text-slate-500" />
          {field.capacity}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={13} className="text-slate-500" />
          {field.availableSlots.length} horarios
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300">
          {surfaceLabel[field.surface]}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {field.availableSlots.map((slot) => (
          <span
            key={`${field.id}-${slot}`}
            className="rounded-lg border border-white/10 bg-slate-800/60 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300"
          >
            {slot}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/5 pt-5">
        <p className="inline-flex items-baseline gap-1 text-slate-100">
          <CircleDollarSign size={15} className="mb-0.5 text-emerald-400" />
          <span className="text-xl font-bold">${field.pricePerHour}</span>
          <span className="text-xs font-medium text-slate-500">/ hora</span>
        </p>

        <button
          type="button"
          className="rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-105"
        >
          Ver detalles
        </button>
      </div>
    </article>
  );
}
