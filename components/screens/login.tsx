"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { AuthShell } from "./auth/auth-shell";
import { ForgotPasswordScreen } from "./forgot-password"; 
import { LoginFooter } from "./login/login-footer";
import { LoginForm } from "./login/login-form";
import { LoginSocialButtons } from "./login/login-social-buttons";
import { RegisterScreen } from "./register";
import type { AppUser } from "./dashboard";


export type Screen = "dashboard" | "login" | "register" | "forgot-password";

type LoginScreenProps = {
  onNavigate?: (screen: Screen, user?: AppUser) => void;
  onBack?: () => void;
};

export function LoginScreen({ onNavigate, onBack }: LoginScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (currentScreen === "register") {
    return (
      <RegisterScreen
        onBackToLogin={() => setCurrentScreen("login")}
        onRegistered={() => setCurrentScreen("login")}
      />
    );
  }

  if (currentScreen === "forgot-password") {
    return <ForgotPasswordScreen onBackToLogin={() => setCurrentScreen("login")} />;
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo iniciar sesión');
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      onNavigate?.("dashboard", data.user);
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden />
          Volver
        </button>
      ) : null}

      <p className="text-center font-sans text-base font-semibold text-black sm:text-left">
        Bienvenido de nuevo
      </p>
      <p className="mb-6 mt-1 text-center font-mono text-[11px] uppercase tracking-wider text-muted sm:text-left">
        Ingresá tus datos para continuar
      </p>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 border border-black bg-black px-3 py-2 font-mono text-xs uppercase tracking-wider text-paper"
        >
          <TriangleAlert size={14} strokeWidth={2} aria-hidden />
          {errorMessage}
        </div>
      ) : null}

      <LoginForm
        email={email}
        password={password}
        showPassword={showPassword}
        isLoading={isLoading}
        rememberMe={rememberMe}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTogglePassword={() => setShowPassword((current) => !current)}
        onToggleRememberMe={() => setRememberMe((current) => !current)}
        onForgotPasswordClick={() => setCurrentScreen("forgot-password")}
        onSubmit={handleLogin}
      />

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-black/15" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
          O continuá con
        </span>
        <div className="h-px flex-1 bg-black/15" />
      </div>

      <LoginSocialButtons
  onLogin={(user) => onNavigate?.("dashboard", user)}/>

      <LoginFooter onRegisterClick={() => setCurrentScreen("register")} />
    </AuthShell>
  );
}