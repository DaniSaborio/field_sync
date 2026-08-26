"use client";

import { useEffect, useState } from "react";
import { FloatingAlert } from "@/components/ui/floating-alert";
import { useOnlineStatus } from "@/lib/use-online-status";

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
}

export function OfflineProvider() {
  const { isOnline, lastOnlineAt, syncSignal } = useOnlineStatus();
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    if (syncSignal > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSynced(true);
    }
  }, [syncSignal]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch((error) => {
          console.warn("No se pudo registrar el service worker:", error);
        });
      } else {
        // En dev (Turbopack) los nombres de los chunks cambian en cada rebuild;
        // un SW cacheando /_next/static/* de una build vieja causa un loop de
        // reload apenas el servidor reinicia. Se desregistra cualquier SW que
        // haya quedado de una prueba anterior en modo producción.
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
        if ("caches" in window) {
          caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
        }
      }
    }
  }, []);

  return (
    <>
      {!isOnline ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-[60] flex h-6 items-center justify-center bg-black font-mono text-[10px] uppercase tracking-wider text-paper"
        >
          Modo offline{lastOnlineAt ? ` · Datos del ${formatTime(lastOnlineAt)}` : ""}
        </div>
      ) : null}
      {showSynced ? <FloatingAlert message="Sincronizado" onDismiss={() => setShowSynced(false)} /> : null}
    </>
  );
}
