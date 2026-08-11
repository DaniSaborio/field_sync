"use client";

import { GoogleLogin } from "@react-oauth/google";
import { FaApple } from "react-icons/fa";
import type { AppUser } from "../dashboard";

type LoginSocialButtonsProps = {
  onLogin?: (user: AppUser) => void;
};

export function LoginSocialButtons({
  onLogin,
}: LoginSocialButtonsProps) {
  const buttonClassName =
    "flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]";

  return (
    <div className="grid grid-cols-2 gap-3">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            const response = await fetch("/api/auth/google", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                credential: credentialResponse.credential,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              alert(data.error);
              return;
            }
            //mantiene la persistencia de la sesión del usuario en el almacenamiento local
            localStorage.setItem("user", JSON.stringify(data.user));

            onLogin?.(data.user);
          } catch (error) {
            console.error("Error iniciando sesión con Google:", error);
            alert("Ocurrió un error al iniciar sesión con Google.");
          }
        }}
        onError={() => {
          console.error("Error al iniciar sesión con Google");
          alert("No fue posible iniciar sesión con Google.");
        }}
      />

      <button type="button" className={buttonClassName}>
        <FaApple className="text-base" />
        <span>Apple</span>
      </button>
    </div>
  );
}