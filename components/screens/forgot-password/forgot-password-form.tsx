import { ArrowRight, Mail } from "lucide-react";
import type { FormEvent } from "react";
import { FloatingInput } from "../auth/floating-input";

type ForgotPasswordFormProps = {
  email: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ForgotPasswordForm({
  email,
  isLoading,
  onEmailChange,
  onSubmit,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FloatingInput
        id="forgot-password-email"
        label="CORREO"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="tu@email.com"
        required
        icon={<Mail size={16} />}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 py-3 text-sm font-bold tracking-[0.3px] text-slate-950 shadow-[0_6px_18px_rgba(16,185,129,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-current" />
        ) : (
          <>
            <span>Enviar enlace de recuperación</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}