import type { ReactNode } from "react";
import { LoginBrand } from "@/components/screens/login/login-brand";

type AuthShellProps = {
  tagline?: string;
  children: ReactNode;
};

export function AuthShell({ tagline, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-paper font-sans">
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-[420px]">
          <LoginBrand />
          {tagline ? (
            <p className="-mt-6 mb-6 text-center font-mono text-[11px] uppercase tracking-wider text-muted">
              {tagline}
            </p>
          ) : null}

          <div className="border border-black bg-paper p-5 shadow-hard sm:p-6">
            {children}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
          FieldSync v1.0.0
        </p>
      </div>
    </div>
  );
}
