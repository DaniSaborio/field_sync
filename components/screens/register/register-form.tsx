import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import type { FormEvent } from "react";
import { FloatingInput } from "../auth/floating-input";

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
    <form onSubmit={onSubmit} className="space-y-3">
      <FloatingInput
        id="register-full-name"
        label="NOMBRE COMPLETO"
        type="text"
        value={fullName}
        onChange={onFullNameChange}
        placeholder="Tu nombre"
        required
        icon={<User size={16} />}
      />

      <FloatingInput
        id="register-email"
        label="CORREO ELECTRÓNICO"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="tu@email.com"
        required
        icon={<Mail size={16} />}
      />

      <FloatingInput
        id="register-password"
        label="CONTRASEÑA"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={onPasswordChange}
        placeholder="Mínimo 8 caracteres"
        required
        minLength={8}
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

      <FloatingInput
        id="register-confirm-password"
        label="CONFIRMAR CONTRASEÑA"
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder="Repite tu contraseña"
        required
        minLength={8}
        icon={<Lock size={16} />}
        rightSlot={
          <button
            type="button"
            onClick={onToggleConfirmPassword}
            className="text-slate-500 transition hover:text-slate-300"
            aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <button
        type="button"
        onClick={onToggleTerms}
        className="flex items-center gap-2 pt-1 text-left"
      >
        <span
          className="flex h-4 w-4 items-center justify-center rounded-[6px] border text-[10px]"
          style={{
            background: acceptTerms ? "#10B981" : "transparent",
            borderColor: acceptTerms ? "transparent" : "rgba(255,255,255,0.15)",
            color: acceptTerms ? "#052e21" : "transparent",
          }}
        >
          ✓
        </span>
        <span className="text-xs font-medium text-slate-400">
          Acepto términos y condiciones
        </span>
      </button>

      <button
        type="submit"
        disabled={isLoading || !acceptTerms || password !== confirmPassword}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 py-3 text-sm font-bold tracking-[0.3px] text-slate-950 shadow-[0_6px_18px_rgba(16,185,129,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-current" />
        ) : (
          <>
            <span>Crear cuenta</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}