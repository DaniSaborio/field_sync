import { CalendarCheck2, CircleDollarSign, UserPlus, type LucideIcon } from "lucide-react";
 
export type ActivityType = "booking" | "payment" | "signup";
 
export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  time: string;
};
 
const typeConfig: Record<ActivityType, { icon: LucideIcon; label: string }> = {
  booking: { icon: CalendarCheck2, label: "Reserva" },
  payment: { icon: CircleDollarSign, label: "Pago" },
  signup: { icon: UserPlus, label: "Usuario" },
};
 
const defaultActivity: ActivityItem[] = [
  {
    id: "act-1",
    type: "booking",
    title: "Complejo Norte - Cancha A",
    detail: "Reservada por Luis Fernandez, 18:00 - 19:00",
    time: "Hace 8 min",
  },
  {
    id: "act-2",
    type: "payment",
    title: "Pago confirmado",
    detail: "Estadio Barrial - Cancha 2, $68.00",
    time: "Hace 22 min",
  },
  {
    id: "act-3",
    type: "signup",
    title: "Nuevo jugador registrado",
    detail: "Maria Jimenez se unio como Jugador",
    time: "Hace 1 h",
  },
  {
    id: "act-4",
    type: "booking",
    title: "Arena Indoor Center",
    detail: "Reservada por Equipo Rayo Arena, 20:00 - 21:00",
    time: "Hace 2 h",
  },
];
 
type AdminActivityFeedProps = {
  activity?: ActivityItem[];
};
 
export function AdminActivityFeed({ activity = defaultActivity }: AdminActivityFeedProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-slate-400">
          ACTIVIDAD RECIENTE
        </h2>
        <button
          type="button"
          className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          Ver todo
        </button>
      </div>
 
      <ul className="divide-y divide-white/5">
        {activity.map((item) => {
          const { icon: Icon, label } = typeConfig[item.type];
 
          return (
            <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-800/80 text-slate-300">
                <Icon size={16} />
              </span>
 
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                  <span className="shrink-0 text-[11px] text-slate-500">{item.time}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-400">{item.detail}</p>
              </div>
 
              <span className="hidden shrink-0 rounded-full border border-white/10 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-400 sm:inline-block">
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}