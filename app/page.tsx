"use client";

import { useEffect, useState } from "react";
import { DashboardScreen, type AppUser } from "@/components/screens/dashboard";
import { LoginScreen } from "@/components/screens/login";

export default function Home() {
  const [screen, setScreen] = useState<"login" | "dashboard">("login");
  const [user, setUser] = useState<AppUser | null>(null);
// Verifica si hay un usuario guardado en el almacenamiento local al cargar la página
  useEffect(() => {
  const savedUser = localStorage.getItem("user");

  if (savedUser) {
    setUser(JSON.parse(savedUser));
    setScreen("dashboard");
  }
}, []);

  if (screen === "dashboard" && user) {
    return (
      <DashboardScreen
        user={user}
        onLogout={() => {
        localStorage.removeItem("user"); // Elimina el usuario del almacenamiento local al cerrar sesión
        setUser(null);// Restablece el estado del usuario a null
        setScreen("login"); // Cambia la pantalla a "login" al cerrar sesión
      }}
      />
    );
  }

  return (
    <LoginScreen
      onNavigate={(nextScreen, nextUser) => {
        if (nextScreen === "dashboard" && nextUser) {
          setUser(nextUser);
          setScreen("dashboard");
        }
      }}
    />
  );
}
