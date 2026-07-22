import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import type { FormEvent } from "react";

type RegisterFormProps = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  acceptTerms: boolean;
  isLoading: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onToggleTerms: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RegisterForm({
  fullName,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  acceptTerms,
  isLoading,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onToggleTerms,
  onSubmit,
}: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-[0.5px] text-slate-400">
          NOMBRE COMPLETO
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <User size={18} />
          </div>
          <input
            type="text"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder="Tu nombre"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold tracking-[0.5px] text-slate-400">
          CORREO ELECTRONICO
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
          CONTRASENA
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Lock size={18} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Minimo 8 caracteres"
            required
            minLength={8}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-12 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold tracking-[0.5px] text-slate-400">
          CONFIRMAR CONTRASENA
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Lock size={18} />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            placeholder="Repite tu contrasena"
            required
            minLength={8}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-4 pl-12 pr-12 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
          />
          <button
            type="button"
            onClick={onToggleConfirmPassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
            aria-label={showConfirmPassword ? "Ocultar confirmacion" : "Mostrar confirmacion"}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleTerms}
        className="flex items-center gap-2 text-left"
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-md border text-[12px]"
          style={{
            background: acceptTerms ? "#10B981" : "#1E293B",
            borderColor: acceptTerms ? "transparent" : "rgba(255,255,255,0.1)",
            color: acceptTerms ? "#0F172A" : "transparent",
          }}
        >
          ✓
        </span>
        <span className="text-xs font-medium text-slate-400">
          Acepto terminos y condiciones
        </span>
      </button>

      <button
        type="submit"
        disabled={isLoading || !acceptTerms || password !== confirmPassword}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-600 py-4 text-sm font-bold tracking-[0.3px] text-slate-950 shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-current" />
        ) : (
          <>
            <span>Crear Cuenta</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}
