"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/shared/auth-shell";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden");
      setStatus("error");
      return;
    }

    setIsLoading(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo restablecer la contraseña");
      }

      setStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo restablecer la contraseña");
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell tagline="Enlace de recuperación">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center border border-black bg-black text-paper">
            <XCircle size={22} strokeWidth={2} aria-hidden />
          </div>
          <p className="font-display text-xl font-black text-black">Enlace inválido</p>
          <p className="mx-auto mt-2 max-w-xs font-sans text-xs leading-relaxed text-muted">
            Este enlace de recuperación no incluye un token válido. Solicitá uno nuevo desde la
            pantalla de inicio de sesión.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex font-mono text-[10px] font-bold uppercase tracking-wider text-black underline"
          >
            Volver al inicio
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell tagline="Enlace de recuperación">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center border border-black bg-neon text-black">
            <CheckCircle2 size={22} strokeWidth={2} aria-hidden />
          </div>
          <p className="font-display text-xl font-black text-black">Contraseña actualizada</p>
          <p className="mx-auto mt-2 max-w-xs font-sans text-xs leading-relaxed text-muted">
            Ya podés iniciar sesión con tu nueva contraseña.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex font-mono text-[10px] font-bold uppercase tracking-wider text-black underline"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell tagline="Elegí tu nueva contraseña">
      <p className="font-sans text-base font-semibold text-black">Restablecer contraseña</p>
      <p className="mb-6 mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
        Ingresá y confirmá tu nueva contraseña
      </p>

      {status === "error" ? (
        <div className="mb-4 border border-black bg-black/5 px-4 py-3 font-sans text-xs text-black">
          {errorMessage}
        </div>
      ) : null}

      <ResetPasswordForm
        password={password}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        isLoading={isLoading}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onTogglePassword={() => setShowPassword((current) => !current)}
        onToggleConfirmPassword={() => setShowConfirmPassword((current) => !current)}
        onSubmit={handleSubmit}
      />
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
