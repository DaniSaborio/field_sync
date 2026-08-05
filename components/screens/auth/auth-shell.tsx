import type { ReactNode } from "react";
import { LoginBrand } from "../login/login-brand";

type AuthShellProps = {
  tagline?: string;
  children: ReactNode;
};

export function AuthShell({ tagline, children }: AuthShellProps) {
  return (
    <div
      className="flex min-h-screen flex-col justify-center bg-[#080e1a]"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-[420px]">
          <LoginBrand />
          {tagline ? (
            <p className="-mt-8 mb-6 text-center text-sm text-slate-400">{tagline}</p>
          ) : null}
          {children}
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-slate-600">FieldSync v1.0.0</p>
      </div>
    </div>
  );
}