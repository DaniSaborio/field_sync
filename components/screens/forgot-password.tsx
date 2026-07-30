"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "./auth/auth-shell";
import { ForgotPasswordForm } from "./forgot-password/forgot-password-form";


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
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
      >
        <ArrowLeft size={14} />
        Volver a iniciar sesión
      </button>

      {isSent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
            <MailCheck size={22} />
          </div>
          <p className="text-base font-semibold text-slate-100">Revisa tu correo</p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
            Si <span className="text-slate-300">{email}</span> tiene una cuenta con nosotros, te
            enviamos un enlace para restablecer tu contraseña.
          </p>
        </div>
      ) : (
        <>
          <p className="text-base font-semibold text-slate-100">¿Olvidaste tu contraseña?</p>
          <p className="mb-6 mt-1 text-xs text-slate-500">
            Ingresa tu correo y te enviamos un enlace para restablecerla
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