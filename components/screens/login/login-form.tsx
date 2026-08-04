import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import type { FormEvent } from "react";
import { FloatingInput } from "../auth/floating-input";

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
  onForgotPasswordClick: () => void;
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
  onForgotPasswordClick,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FloatingInput
        id="login-email"
        label="CORREO"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="tu@email.com"
        required
        icon={<Mail size={16} />}
      />

      <FloatingInput
        id="login-password"
        label="CONTRASEÑA"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={onPasswordChange}
        placeholder="••••••••"
        required
        icon={<Lock size={16} />}
        rightSlot={
          <button
            type="button"
            onClick={onTogglePassword}
            className="text-slate-500 transition hover:text-slate-300"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="flex items-center justify-between gap-4 pt-1">
        <button
          type="button"
          onClick={onToggleRememberMe}
          className="flex items-center gap-2 text-left"
        >
          <span
            className="flex h-4 w-4 items-center justify-center rounded-[6px] border text-[10px]"
            style={{
              background: rememberMe ? "#10B981" : "transparent",
              borderColor: rememberMe ? "transparent" : "rgba(255,255,255,0.15)",
              color: rememberMe ? "#052e21" : "transparent",
            }}
          >
            ✓
          </span>
          <span className="text-xs font-medium text-slate-400">Recordar sesión</span>
        </button>

        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 py-3 text-sm font-bold tracking-[0.3px] text-slate-950 shadow-[0_6px_18px_rgba(16,185,129,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-current" />
        ) : (
          <>
            <span>Iniciar sesión</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}