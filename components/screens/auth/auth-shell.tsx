import type { ReactNode } from "react";
import { AuthBrandPanel } from "./auth-brand-panel";

type AuthShellProps = {
  tagline?: string;
  children: ReactNode;
};

export function AuthShell({ tagline, children }: AuthShellProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#080e1a]"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <div className="mx-auto grid w-full max-w-6xl flex-1 lg:grid-cols-[1fr_1.1fr]">
        <AuthBrandPanel tagline={tagline} />

        <div className="flex flex-col justify-center px-6 py-12 sm:px-10">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-slate-600">FieldSync v1.0.0</p>
      </div>
    </div>
  );
}