"use client";

import { useEffect, useState } from "react";

// syncSignal se incrementa cada vez que el navegador pasa de offline a
// online — sirve para que un componente dispare un refetch real (no solo
// mostrar un aviso) cuando vuelve la conexión. Ver OfflineProvider (el aviso)
// y DashboardScreen (el refetch) para los dos consumidores.
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [syncSignal, setSyncSignal] = useState(0);

  useEffect(() => {
    let wasOffline = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      setLastOnlineAt(new Date());
    }

    function handleOnline() {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      if (wasOffline) {
        setSyncSignal((current) => current + 1);
        wasOffline = false;
      }
    }

    function handleOffline() {
      setIsOnline(false);
      wasOffline = true;
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, lastOnlineAt, syncSignal };
}
