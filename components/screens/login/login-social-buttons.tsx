import react from "react";
import { FaGoogle } from "react-icons/fa";
import { FaApple } from "react-icons/fa";
export function LoginSocialButtons() {
  const buttonClassName =
    "flex items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-slate-900/80 py-3.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-slate-800";

  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" className={buttonClassName}>
        <FaGoogle className="text-lg" />
        <span>Google</span>
      </button>
     
      <button type="button" className={buttonClassName}>
        <FaApple className="text-lg" />
        <span>Apple</span>
      </button>
    </div>
  );
}