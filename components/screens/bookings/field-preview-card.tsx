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
  synthetic: "Sintetica",
  natural: "Natural",
  indoor: "Indoor",
};

export function FieldPreviewCard({ field }: FieldPreviewCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:shadow-[0_12px_24px_rgba(16,185,129,0.12)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{field.name}</h3>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin size={13} />
            {field.location}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <BadgeCheck size={12} />
          {field.rating.toFixed(1)}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2 py-1.5">
          <Users size={13} />
          {field.capacity}
        </p>
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2 py-1.5">
          <CircleDollarSign size={13} />
          ${field.pricePerHour}/hora
        </p>
        <p className="rounded-lg bg-slate-800/80 px-2 py-1.5">{surfaceLabel[field.surface]}</p>
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2 py-1.5">
          <Clock3 size={13} />
          {field.availableSlots.length} horarios
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {field.availableSlots.map((slot) => (
          <span
            key={`${field.id}-${slot}`}
            className="rounded-full border border-white/15 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300"
          >
            {slot}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="w-full rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-105"
      >
        Ver detalles
      </button>
    </article>
  );
}
