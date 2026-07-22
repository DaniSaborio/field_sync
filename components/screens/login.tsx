"use client";

import { useState } from "react";
import { LoginBrand } from "./login/login-brand";
import { LoginFooter } from "./login/login-footer";
import { LoginForm } from "./login/login-form";
import { LoginSocialButtons } from "./login/login-social-buttons";

export type Screen = "bookings" | "login";

type LoginScreenProps = {
	onNavigate?: (screen: Screen) => void;
};

export function LoginScreen({ onNavigate }: LoginScreenProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);

	const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsLoading(true);

		window.setTimeout(() => {
			setIsLoading(false);
			onNavigate?.("bookings");
		}, 1500);
	};

	return (
		<div
			className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(180deg,#0a1628_0%,#080e1a_100%)]"
			style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
		>
			<div className="flex-1 flex flex-col justify-center px-6 py-12">
				<LoginBrand />

				<div className="mx-auto w-full max-w-md">
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

					<LoginFooter />
				</div>
			</div>

			<div className="px-6 pb-8 text-center">
				<p className="text-xs text-slate-600">FieldSync v1.0.0</p>
			</div>
		</div>
	);
}
