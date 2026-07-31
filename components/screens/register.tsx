"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "./auth/auth-shell";
import { LoginSocialButtons } from "./login/login-social-buttons";
import { RegisterFooter } from "./register/register-footer";
import { RegisterForm } from "./register/register-form";

type RegisterScreenProps = {
  onBackToLogin: () => void;
  onRegistered?: () => void;
};

export function RegisterScreen({ onBackToLogin, onRegistered }: RegisterScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!acceptTerms || password !== confirmPassword) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear la cuenta');
      }

      onRegistered?.();
      onBackToLogin();
    } catch (error) {
      console.error('Register failed:', error);
      window.alert(error instanceof Error ? error.message : 'No se pudo crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell tagline="Crea tu cuenta y empieza a reservar canchas en minutos.">
      <p className="text-center text-base font-semibold text-slate-100 sm:text-left">
        Crea tu cuenta
      </p>
      <p className="mb-6 mt-1 text-center text-xs text-slate-500 sm:text-left">
        Únete y empieza a gestionar tus canchas
      </p>

      <RegisterForm
        fullName={fullName}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        acceptTerms={acceptTerms}
        isLoading={isLoading}
        onFullNameChange={setFullName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onTogglePassword={() => setShowPassword((current) => !current)}
        onToggleConfirmPassword={() => setShowConfirmPassword((current) => !current)}
        onToggleTerms={() => setAcceptTerms((current) => !current)}
        onSubmit={handleRegister}
      />

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-500">
          O CONTINUA CON
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <LoginSocialButtons />

      <RegisterFooter onLoginClick={onBackToLogin} />
    </AuthShell>
  );
}