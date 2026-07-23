import {
  CalendarCheck2,
  CircleDollarSign,
  Percent,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
 
export type AdminStat = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down";
  icon: LucideIcon;
};
 
const defaultStats: AdminStat[] = [
  {
    id: "bookings-today",
    label: "Reservas hoy",
    value: "5",
    trend: "+12% vs ayer",
    trendDirection: "up",
    icon: CalendarCheck2,
  },
  {
    id: "revenue-today",
    label: "Ingresos del dia",
    value: "$985",
    trend: "+8% vs ayer",
    trendDirection: "up",
    icon: CircleDollarSign,
  },
  {
    id: "active-fields",
    label: "Canchas activas",
    value: "5",
    trend: "de 9 registradas",
    trendDirection: "up",
    icon: Warehouse,
  },
  {
    id: "occupancy",
    label: "Ocupacion",
    value: "78%",
    trend: "-3% vs ayer",
    trendDirection: "down",
    icon: Percent,
  },
];
 
type AdminStatsProps = {
  stats?: AdminStat[];
};
 
export function AdminStats({ stats = defaultStats }: AdminStatsProps) {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
 
        return (
          <div
            key={stat.id}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <Icon size={18} />
              </span>
              <span
                className={`text-xs font-semibold ${
                  stat.trendDirection === "up" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {stat.trend}
              </span>
            </div>
 
            <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{stat.label}</p>
          </div>
        );
      })}
    </section>
  );
}