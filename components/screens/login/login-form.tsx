import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { RowCheckbox } from "@/components/ui/row";

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
        label="Correo"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="tu@email.com"
        required
        icon={<Mail size={16} strokeWidth={2} aria-hidden />}
      />

      <FloatingInput
        id="login-password"
        label="Contraseña"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={onPasswordChange}
        placeholder="••••••••"
        required
        icon={<Lock size={16} strokeWidth={2} aria-hidden />}
        rightSlot={
          <button
            type="button"
            onClick={onTogglePassword}
            className="text-black"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff size={16} strokeWidth={2} aria-hidden />
            ) : (
              <Eye size={16} strokeWidth={2} aria-hidden />
            )}
          </button>
        }
      />

      <div className="flex items-center justify-between gap-4 pt-1">
        <label className="flex items-center gap-2">
          <RowCheckbox
            checked={rememberMe}
            onCheckedChange={onToggleRememberMe}
            className="size-5"
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Recordar sesión
          </span>
        </label>

        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="font-mono text-[10px] font-bold uppercase tracking-wider text-black underline underline-offset-4"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? (
          "Enviando…"
        ) : (
          <>
            Iniciar sesión
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </>
        )}
      </Button>
    </form>
  );
}
