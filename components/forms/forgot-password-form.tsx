import { ArrowRight, Mail } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";

import { FloatingInput } from "./floating-input";

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
        label="Correo"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="tu@email.com"
        required
        icon={<Mail size={16} strokeWidth={2} aria-hidden />}
      />

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? (
          "Enviando…"
        ) : (
          <>
            Enviar enlace de recuperación
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </>
        )}
      </Button>
    </form>
  );
}
