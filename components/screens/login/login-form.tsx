import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import type { FormEvent } from "react";

type LoginFormProps = {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleRememberMe: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginForm({
  email,
  password,
  showPassword,
  isLoading,
  rememberMe,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onToggleRememberMe,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-[0.5px] text-slate-400">
          CORREO ELECTRÓNICO
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Mail size={18} />
          </div>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="tu@email.com"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold tracking-[0.5px] text-slate-400">
          CONTRASEÑA
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Lock size={18} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-12 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onToggleRememberMe}
          className="flex items-center gap-2 text-left"
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-md border text-[12px]"
            style={{
              background: rememberMe ? "#10B981" : "#1E293B",
              borderColor: rememberMe ? "transparent" : "rgba(255,255,255,0.1)",
              color: rememberMe ? "#0F172A" : "transparent",
            }}
          >
            ✓
          </span>
          <span className="text-xs font-medium text-slate-400">
            Recordar sesión
          </span>
        </button>

        <button
          type="button"
          className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-600 py-4 text-sm font-bold tracking-[0.3px] text-slate-950 shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-current" />
        ) : (
          <>
            <span>Iniciar Sesión</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}