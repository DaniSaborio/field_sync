"use client";

import { useState } from "react";
import { BookingsScreen } from "@/components/screens/bookings";
import { LoginScreen } from "@/components/screens/login";

export default function Home() {
  const [screen, setScreen] = useState<"login" | "bookings">("login");

  if (screen === "bookings") {
    return <BookingsScreen onLogout={() => setScreen("login")} />;
  }

  return (
    <LoginScreen
      onNavigate={(nextScreen) => {
        if (nextScreen === "bookings") {
          setScreen("bookings");
        }
      }}
    />
  );
}
