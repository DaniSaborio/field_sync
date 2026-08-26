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
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Por seguridad, siempre se muestra el mismo mensaje exista o no la cuenta.
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      // Modo demo: no hay servicio de email conectado, así que el backend
      // devuelve el enlace directamente para poder probar el flujo.
      setDevResetUrl(typeof data?.devResetUrl === "string" ? data.devResetUrl : null);
    } catch {
      setDevResetUrl(null);
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

          {devResetUrl ? (
            <div className="mx-auto mt-4 max-w-xs border border-black bg-black/5 p-3 text-left">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted">
                Modo demo · sin envío de correo real
              </p>
              <a
                href={devResetUrl}
                className="mt-1 block break-all font-mono text-[10px] text-black underline"
              >
                {devResetUrl}
              </a>
            </div>
          ) : null}
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