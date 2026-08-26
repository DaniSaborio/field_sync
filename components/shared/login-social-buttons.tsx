"use client";

import { GoogleLogin } from "@react-oauth/google";
import type { AppUser } from "@/components/screens/dashboard";

type LoginSocialButtonsProps = {
  onLogin?: (user: AppUser) => void;
};

export function LoginSocialButtons({
  onLogin,
}: LoginSocialButtonsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
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
    </div>
  );
}