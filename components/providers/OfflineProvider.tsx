"use client";

import { useEffect, useRef, useState } from "react";
import { FloatingAlert } from "@/components/ui/floating-alert";

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
}

export function OfflineProvider() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [showSynced, setShowSynced] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("No se pudo registrar el service worker:", error);
      });
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      setLastOnlineAt(new Date());
    }

    function handleOnline() {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      if (wasOffline.current) {
        setShowSynced(true);
        wasOffline.current = false;
      }
    }

    function handleOffline() {
      setIsOnline(false);
      wasOffline.current = true;
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
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
