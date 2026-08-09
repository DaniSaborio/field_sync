import { ArrowRight, Eye, EyeOff, Lock, Mail, Tag, User } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { RowCheckbox } from "@/components/ui/row";

import { FloatingInput } from "../auth/floating-input";

type RegisterFormProps = {
  fullName: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  acceptTerms: boolean;
  isLoading: boolean;
  onFullNameChange: (value: string) => void;
  onNicknameChange: (value: string) => void;
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
  nickname,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  acceptTerms,
  isLoading,
  onFullNameChange,
  onNicknameChange,
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
        label="Nombre completo"
        type="text"
        value={fullName}
        onChange={onFullNameChange}
        placeholder="Tu nombre"
        required
        icon={<User size={16} strokeWidth={2} aria-hidden />}
      />

      <FloatingInput
        id="register-nickname"
        label="Apodo (opcional)"
        type="text"
        value={nickname}
        onChange={onNicknameChange}
        placeholder="Cómo te dicen en la cancha"
        icon={<Tag size={16} strokeWidth={2} aria-hidden />}
      />

      <FloatingInput
        id="register-email"
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="tu@email.com"
        required
        icon={<Mail size={16} strokeWidth={2} aria-hidden />}
      />

      <FloatingInput
        id="register-password"
        label="Contraseña"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={onPasswordChange}
        placeholder="Mínimo 8 caracteres"
        required
        minLength={8}
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

      <FloatingInput
        id="register-confirm-password"
        label="Confirmar contraseña"
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder="Repite tu contraseña"
        required
        minLength={8}
        icon={<Lock size={16} strokeWidth={2} aria-hidden />}
        rightSlot={
          <button
            type="button"
            onClick={onToggleConfirmPassword}
            className="text-black"
            aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
          >
            {showConfirmPassword ? (
              <EyeOff size={16} strokeWidth={2} aria-hidden />
            ) : (
              <Eye size={16} strokeWidth={2} aria-hidden />
            )}
          </button>
        }
      />

      <label className="flex items-center gap-2 pt-1">
        <RowCheckbox checked={acceptTerms} onCheckedChange={onToggleTerms} className="size-5" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Acepto términos y condiciones
        </span>
      </label>

      <Button
        type="submit"
        disabled={isLoading || !acceptTerms || password !== confirmPassword}
        className="mt-2 w-full"
      >
        {isLoading ? (
          "Enviando…"
        ) : (
          <>
            Crear cuenta
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </>
        )}
      </Button>
    </form>
  );
}
