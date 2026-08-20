"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "@/components/shared/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";


type ForgotPasswordScreenProps = {
  onBackToLogin: () => void;
};

export function ForgotPasswordScreen({ onBackToLogin }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // TODO: reemplazar por el endpoint real, p. ej. POST /api/auth/forgot-password
      // Por seguridad, siempre se muestra el mismo mensaje exista o no la cuenta.
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => undefined);
    } finally {
      setIsLoading(false);
      setIsSent(true);
    }
  };

  return (
    <AuthShell tagline="Te ayudamos a recuperar el acceso a tu cuenta.">
      <button
        type="button"
        onClick={onBackToLogin}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black"
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden />
        Volver a iniciar sesión
      </button>

      {isSent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center border border-black bg-neon text-black">
            <MailCheck size={22} strokeWidth={2} aria-hidden />
          </div>
          <p className="font-display text-xl font-black text-black">Revisá tu correo</p>
          <p className="mx-auto mt-2 max-w-xs font-sans text-xs leading-relaxed text-muted">
            Si <span className="font-semibold text-black">{email}</span> tiene una cuenta con
            nosotros, te enviamos un enlace para restablecer tu contraseña.
          </p>
        </div>
      ) : (
        <>
          <p className="font-sans text-base font-semibold text-black">
            ¿Olvidaste tu contraseña?
          </p>
          <p className="mb-6 mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
            Ingresá tu correo y te enviamos un enlace para restablecerla
          </p>

          <ForgotPasswordForm
            email={email}
            isLoading={isLoading}
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </AuthShell>
  );
}