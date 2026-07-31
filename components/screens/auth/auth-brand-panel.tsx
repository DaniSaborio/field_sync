const features = [
  "Reservas en tiempo real",
  "Torneos y tabla de posiciones",
  "Notificaciones al instante",
];

type AuthBrandPanelProps = {
  tagline?: string;
};

export function AuthBrandPanel({
  tagline = "Gestiona canchas, torneos y equipos en un solo lugar.",
}: AuthBrandPanelProps) {
  return (
    <div
      className="relative hidden min-h-screen flex-col justify-between overflow-hidden px-10 py-12 lg:flex"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), radial-gradient(circle at 20% 15%, rgba(16,185,129,0.16), transparent 55%), radial-gradient(circle at 85% 80%, rgba(16,185,129,0.10), transparent 50%), linear-gradient(160deg, #0b1830 0%, #060b15 100%)",
        backgroundSize: "26px 26px, 26px 26px, auto, auto, auto",
      }}
    >
      <div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-600 shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
          <span className="text-2xl">⚽</span>
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-100">FieldSync</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">{tagline}</p>
      </div>

      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}