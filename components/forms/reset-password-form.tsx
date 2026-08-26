import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";

import { FloatingInput } from "./floating-input";

type ResetPasswordFormProps = {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ResetPasswordForm({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  isLoading,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
}: ResetPasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FloatingInput
        id="reset-password-password"
        label="Nueva contraseña"
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
        id="reset-password-confirm"
        label="Confirmar contraseña"
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder="Repite tu nueva contraseña"
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

      <Button
        type="submit"
        disabled={isLoading || !password || password !== confirmPassword}
        className="mt-2 w-full"
      >
        {isLoading ? (
          "Guardando…"
        ) : (
          <>
            Restablecer contraseña
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </>
        )}
      </Button>
    </form>
  );
}
