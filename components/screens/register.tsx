"use client";

import { useState } from "react";
import { LoginBrand } from "./login/login-brand";
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

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
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
    <div
      className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_30%),linear-gradient(180deg,#0a1628_0%,#080e1a_100%)]"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <LoginBrand />

        <div className="mx-auto w-full max-w-md">
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

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-semibold tracking-[0.2em] text-slate-500">O</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <LoginSocialButtons />

          <RegisterFooter onLoginClick={onBackToLogin} />
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-slate-600">FieldSync v1.0.0</p>
      </div>
    </div>
  );
}
