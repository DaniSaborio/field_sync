"use client";

import { useEffect, useState } from "react";
import { DashboardScreen, GuestBookingScreen, type AppUser } from "@/components/screens/dashboard";
import { LoginScreen } from "@/components/screens/login";

export default function Home() {
  const [screen, setScreen] = useState<"guest" | "login" | "dashboard">("guest");
  const [user, setUser] = useState<AppUser | null>(null);

  // La sesión vive en una cookie httpOnly, así que el cliente no puede leerla
  // directamente: le pedimos a /api/auth/me que la verifique y nos diga quién
  // sos, en vez de confiar en algo guardado por el propio navegador.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setUser(data.user);
        setScreen("dashboard");
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (screen === "dashboard" && user) {
    return (
      <DashboardScreen
        user={user}
        onLogout={() => {
          fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          setUser(null);
          setScreen("guest"); // Vuelve a la vista de invitado al cerrar sesión, sin forzar el login
        }}
        onUserUpdate={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    );
  }

  if (screen === "login") {
    return (
      <LoginScreen
        onBack={() => setScreen("guest")}
        onNavigate={(nextScreen, nextUser) => {
          if (nextScreen === "dashboard" && nextUser) {
            setUser(nextUser);
            setScreen("dashboard");
          }
        }}
      />
    );
  }

  return <GuestBookingScreen onRequireLogin={() => setScreen("login")} />;
}
