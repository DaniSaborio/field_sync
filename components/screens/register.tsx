"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "@/components/shared/auth-shell";
import { LoginSocialButtons } from "@/components/shared/login-social-buttons";
import { RegisterFooter } from "./register/register-footer";
import { RegisterForm } from "@/components/forms/register-form";

type RegisterScreenProps = {
  onBackToLogin: () => void;
  onRegistered?: () => void;
};

export function RegisterScreen({ onBackToLogin, onRegistered }: RegisterScreenProps) {
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
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
        body: JSON.stringify({ fullName, nickname, email, password }),
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
    <AuthShell tagline="Creá tu cuenta y empezá a reservar canchas en minutos.">
      <p className="text-center font-sans text-base font-semibold text-black sm:text-left">
        Creá tu cuenta
      </p>
      <p className="mb-6 mt-1 text-center font-mono text-[11px] uppercase tracking-wider text-muted sm:text-left">
        Unite y empezá a gestionar tus canchas
      </p>

      <RegisterForm
        fullName={fullName}
        nickname={nickname}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        acceptTerms={acceptTerms}
        isLoading={isLoading}
        onFullNameChange={setFullName}
        onNicknameChange={setNickname}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onTogglePassword={() => setShowPassword((current) => !current)}
        onToggleConfirmPassword={() => setShowConfirmPassword((current) => !current)}
        onToggleTerms={() => setAcceptTerms((current) => !current)}
        onSubmit={handleRegister}
      />

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-black/15" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
          O continuá con
        </span>
        <div className="h-px flex-1 bg-black/15" />
      </div>

      <LoginSocialButtons />

      <RegisterFooter onLoginClick={onBackToLogin} />
    </AuthShell>
  );
}