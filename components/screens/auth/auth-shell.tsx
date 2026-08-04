import type { ReactNode } from "react";
import { AuthBrandPanel } from "./auth-brand-panel";

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
      <div className="grid w-full flex-1 items-stretch lg:grid-cols-[1.08fr_0.92fr]">
        <AuthBrandPanel tagline={tagline} />

        <div className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:min-h-0 lg:px-10 lg:py-12">
          <div className="mx-auto w-full max-w-[420px]">{children}</div>
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-slate-600">FieldSync v1.0.0</p>
      </div>
    </div>
  );
}