"use client";

import { useState } from "react";
import { LoginBrand } from "./login/login-brand";
import { LoginFooter } from "./login/login-footer";
import { LoginForm } from "./login/login-form";
import { LoginSocialButtons } from "./login/login-social-buttons";
import { RegisterScreen } from "./register";

export type Screen = "bookings" | "login" | "register";

type LoginScreenProps = {
	onNavigate?: (screen: Screen) => void;
};

export function LoginScreen({ onNavigate }: LoginScreenProps) {
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

	const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
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

			onNavigate?.('bookings');
		} catch (error) {
			console.error('Login failed:', error);
			setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
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
					{errorMessage ? (
						<div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
						onSubmit={handleLogin}
					/>

					<div className="flex items-center gap-4 my-8">
						<div className="h-px flex-1 bg-white/10" />
						<span className="text-xs font-semibold tracking-[0.2em] text-slate-500">
							O
						</span>
						<div className="h-px flex-1 bg-white/10" />
					</div>

					<LoginSocialButtons />

					<LoginFooter onRegisterClick={() => setCurrentScreen("register")} />
				</div>
			</div>

			<div className="px-6 pb-8 text-center">
				<p className="text-xs text-slate-600">FieldSync v1.0.0</p>
			</div>
		</div>
	);
}
