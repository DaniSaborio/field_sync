"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, CheckCircle2, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPushSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import type { AppUser } from "./types";

export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-black bg-paper px-1.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-black">
      <BadgeCheck size={12} strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

export function PanelShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-black bg-paper p-4 shadow-hard sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-black pb-4">
        <div>
          <h2 className="font-display text-xl font-black leading-tight tracking-tight text-black">{title}</h2>
          <p className="mt-1 font-sans text-sm text-muted">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center border border-black bg-paper px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
      {children}
    </span>
  );
}

export function PushSubscribeButton({ userId }: { userId: number }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPushSupported()) return;
    let cancelled = false;
    getPushSubscription()
      .then((subscription) => {
        if (cancelled) return;
        setSupported(true);
        setSubscribed(Boolean(subscription));
      })
      .catch(() => {
        if (!cancelled) setSupported(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!supported) return null;

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush(userId);
        setSubscribed(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos activar las notificaciones push");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <Button type="button" size="sm" variant="secondary" onClick={toggle} disabled={busy}>
        {subscribed ? "Desactivar notis push" : "Activar notis push"}
      </Button>
      {error ? <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-black">{error}</p> : null}
    </div>
  );
}

export function MessageBanner({ message }: { message: string }) {
  const isNegative = /no pudimos|no es posible|no fue posible/i.test(message);
  return (
    <div
      role={isNegative ? "alert" : "status"}
      className={`mb-4 flex items-center gap-2 border border-black px-3 py-2 font-mono text-xs uppercase tracking-wider ${
        isNegative ? "bg-black text-paper" : "bg-paper text-black"
      }`}
    >
      {isNegative ? (
        <TriangleAlert size={14} strokeWidth={2} aria-hidden />
      ) : (
        <CheckCircle2 size={14} strokeWidth={2} aria-hidden />
      )}
      {message}
    </div>
  );
}

// Aviso opcional y descartable tras iniciar sesión para quien todavía no tiene
// apodo: no bloquea el uso de la app, solo invita a diferenciarse de otros
// jugadores con el mismo nombre. Se recuerda el "ahora no" por pestaña/sesión
// (sessionStorage), así que vuelve a aparecer en el próximo login si sigue sin apodo.
export function NicknameBanner({ user, onOpenProfile }: { user: AppUser; onOpenProfile: () => void }) {
  const dismissKey = `nickname-prompt-dismissed-${user.id}`;
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(dismissKey) === "1",
  );

  function dismiss() {
    sessionStorage.setItem(dismissKey, "1");
    setDismissed(true);
  }

  if (user.nickname || dismissed) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-black bg-paper px-3 py-2 shadow-hard-sm">
      <div className="flex min-w-0 items-center gap-2">
        <BadgeCheck size={14} strokeWidth={2} className="shrink-0" aria-hidden />
        <p className="truncate font-mono text-[11px] uppercase tracking-wider text-black">
          Agregá un apodo para diferenciarte en plantillas y torneos.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            dismiss();
            onOpenProfile();
          }}
        >
          Agregar apodo
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Descartar aviso de apodo"
          className="flex size-8 shrink-0 items-center justify-center border border-black bg-paper"
        >
          <X size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
