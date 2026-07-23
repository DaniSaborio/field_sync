import { LayoutDashboard, LogOut } from "lucide-react";
 
type AdminHeaderProps = {
  tenantName: string;
  onLogout: () => void;
};
 
export function AdminHeader({ tenantName, onLogout }: AdminHeaderProps) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-300">
          <LayoutDashboard size={14} />
          PANEL ADMINISTRADOR
        </p>
        <h1 className="text-3xl font-bold text-slate-100">{tenantName}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Resumen de reservas, canchas y actividad reciente.
        </p>
      </div>
 
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-slate-800 hover:text-slate-100"
      >
        <LogOut size={14} />
        Cerrar sesion
      </button>
    </header>
  );
}