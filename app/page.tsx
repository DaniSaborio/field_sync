"use client";

import { useState } from "react";
import { DashboardScreen, type AppUser } from "@/components/screens/dashboard";
import { LoginScreen } from "@/components/screens/login";

export default function Home() {
  const [screen, setScreen] = useState<"login" | "dashboard">("login");
  const [user, setUser] = useState<AppUser | null>(null);

  if (screen === "dashboard" && user) {
    return (
      <DashboardScreen
        user={user}
        onLogout={() => {
          setUser(null);
          setScreen("login");
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
