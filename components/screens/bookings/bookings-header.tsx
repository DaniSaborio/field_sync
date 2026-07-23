//aqui agregamos el icono del panel de administrador
import { LayoutDashboard, LogOut, MapPin } from "lucide-react";

type BookingsHeaderProps = {
   onLogout: () => void; //esta funcion cierra la sesion
  onAdmin?: () => void;// esta funcion se ejecuta al presionar el boton del administrador
  showAdminButton?: boolean;//esta controla si el boton del administrador se muestra o no
  //va a depender del rol que tenga el usuario en la base de datos
};

//por el momento el boton siempre se va a ver visible, pero cuando se conecte a la base de datos este valor va a depender del rol del usuario solo se muestra si es admin
export function BookingsHeader({ onLogout, onAdmin, showAdminButton = true, }: BookingsHeaderProps) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-300">
          <MapPin size={14} />
          CANCHAS DISPONIBLES
        </p>
        <h1 className="text-3xl font-bold text-slate-100">Reserva tu proximo partido</h1>
        <p className="mt-2 text-sm text-slate-400">
          Explora horarios libres y compara precios antes de reservar.
        </p>
      </div>

      <div className="flex items-center gap-3">

{/*Por ahora siempre se va a mostrar
    Más adelante solamente aparecerá si el usuario tiene rol "admin". */}
  {showAdminButton && (
    <button
      type="button"
      onClick={onAdmin}
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
    >
      <LayoutDashboard size={14} />
      Administrador
    </button>
  )}

  <button
    type="button"
    onClick={onLogout}
    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:bg-slate-800 hover:text-slate-100"
  >
    <LogOut size={14} />
    Cerrar sesión
  </button>

</div>
    </header>
  );
}
