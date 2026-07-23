import {
  BarChart3,
  CircleDollarSign,
  Trophy,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
 
export type AdminAction = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};
 
const actions: AdminAction[] = [
  {
    id: "fields",
    label: "Canchas",
    description: "Alta, edicion y disponibilidad",
    icon: Warehouse,
  },
  {
    id: "tournaments",
    label: "Torneos",
    description: "Crear y dar seguimiento",
    icon: Trophy,
  },
  {
    id: "rates",
    label: "Tarifas",
    description: "Precios por horario",
    icon: CircleDollarSign,
  },
  {
    id: "reports",
    label: "Reportes",
    description: "Ingresos y ocupacion",
    icon: BarChart3,
  },
];
 
type AdminQuickActionsProps = {
  onSelect?: (actionId: string) => void;
};
 
export function AdminQuickActions({ onSelect }: AdminQuickActionsProps) {
  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-slate-400">
        GESTION RAPIDA
      </div>
 
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action) => {
          const Icon = action.icon;
 
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onSelect?.(action.id)}
              className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-slate-900/80 p-3 text-left transition hover:border-emerald-400/40 hover:bg-slate-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <Icon size={16} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-100">
                  {action.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  {action.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}