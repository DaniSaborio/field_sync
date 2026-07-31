"use client";

import { GoogleLogin } from "@react-oauth/google";
import { FaApple } from "react-icons/fa";

export function LoginSocialButtons() {
  const buttonClassName =
    "flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]";

  return (
    <div className="grid grid-cols-2 gap-3">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          console.log("Google Login:", credentialResponse);
        }}
        onError={() => {
          console.log("Error al iniciar sesión con Google");
        }}
      />

      <button type="button" className={buttonClassName}>
        <FaApple className="text-base" />
        <span>Apple</span>
      </button>
    </div>
  );
}