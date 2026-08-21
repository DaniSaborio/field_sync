"use client";

import { useState } from "react";
import { Bell, Building2, LogOut, MapPin, Settings2, ShieldCheck, Trophy, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TenantRequestScreen } from "./tenant-request";
import { AdminPanel } from "./dashboard/admin-panel";
import { BookingPanel } from "./dashboard/booking-panel";
import { MyTournamentsPanel } from "./dashboard/my-tournaments-panel";
import { NotificationsPanel } from "./dashboard/notifications-panel";
import { ProfilePanel } from "./dashboard/profile-panel";
import { NicknameBanner, StatusPill } from "./dashboard/shared-ui";
import { TeamsPanel } from "./dashboard/teams-panel";
import { TenantCourtsPanel } from "./dashboard/tenant-courts-panel";
import { TenantPaymentsPanel } from "./dashboard/tenant-payments-panel";
import { TournamentsPanel } from "./dashboard/tournaments-panel";
import type { AppUser } from "./dashboard/types";
import { humanRole, isAdmin, isTenant } from "./dashboard/utils";

export type { AppUser } from "./dashboard/types";
export { GuestBookingScreen } from "./dashboard/guest-booking-screen";

const tabButtons = [
  { id: "reservas", label: "Reservas", icon: MapPin },
  { id: "torneos", label: "Torneos", icon: Trophy },
  { id: "perfil", label: "Perfil", icon: Settings2 },
  { id: "equipo", label: "Equipos", icon: Users },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "administracion", label: "Administración", icon: ShieldCheck },
] as const;

type DashboardScreenProps = {
  user: AppUser;
  onLogout: () => void;
  onUserUpdate: (user: AppUser) => void;
};

export function DashboardScreen({ user, onLogout, onUserUpdate }: DashboardScreenProps) {
  type DashboardTab = "reservas" | "torneos" | "perfil" | "equipo" | "notificaciones" | "tenant-request" |"mis-canchas" |"administracion";

  const [activeTab, setActiveTab] = useState<DashboardTab>("reservas");
  const visibleTabs = [
  ...tabButtons.filter(
    (tab) => tab.id !== "administracion"
  ),
  ...(isTenant(user)
    ? [
        {
          id: "mis-canchas" as const,
          label: "Mis canchas",
          icon: Building2,
        },
      ]
    : []),
  ...(isAdmin(user)
    ? [
        {
          id: "administracion" as const,
          label: "Administración",
          icon: ShieldCheck,
        },
      ]
    : []),
];

  return (
    <div className="min-h-screen bg-paper px-4 py-6 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <NicknameBanner user={user} onOpenProfile={() => setActiveTab("perfil")} />
        <header className="flex flex-col gap-4 border border-black bg-paper p-5 shadow-hard lg:flex-row lg:items-center lg:justify-between">
          <div>
            <StatusPill>Sesión activa</StatusPill>
            <h1 className="mt-3 font-display text-3xl font-black leading-none tracking-tight text-black">
              Hola, {user.nickname || user.fullName}
            </h1>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              {humanRole(user.role)} · {user.email}
              {user.tenantId ? ` · tenant #${user.tenantId}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant={isActive ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} strokeWidth={2} aria-hidden />
                  {tab.label}
                </Button>
              );
            })}
            <Button type="button" variant="destructive" size="sm" onClick={onLogout}>
              <LogOut size={16} strokeWidth={2} aria-hidden />
              Salir
            </Button>
          </div>
        </header>

        {activeTab === "reservas" ? (
          isTenant(user) ? (
            <div className="space-y-6">
              <TenantPaymentsPanel user={user} />
              <BookingPanel user={user} restrictToTenantId={user.id} />
            </div>
          ) : (
            <BookingPanel user={user} />
          )
        ) : null}
        {activeTab === "torneos" ? (isAdmin(user) || isTenant(user) ? <TournamentsPanel user={user} /> : <MyTournamentsPanel user={user} />) : null}
        {activeTab === "perfil" ? (<ProfilePanel user={user} onRequestTenant={() => setActiveTab("tenant-request")} onUserUpdate={onUserUpdate} />) : null}
        {activeTab === "equipo" ? <TeamsPanel user={user} /> : null}
        {activeTab === "mis-canchas" && isTenant(user) ? (
          <TenantCourtsPanel user={user} onRequestMoreCourts={() => setActiveTab("tenant-request")} />
        ) : null}
        {activeTab === "tenant-request" ? (<TenantRequestScreen user={user} isTenant={isTenant(user)} />) : null}
        {activeTab === "notificaciones" ? <NotificationsPanel user={user} /> : null}
        {activeTab === "administracion" && isAdmin(user) ? <AdminPanel user={user} /> : null}
      </div>
    </div>
  );
}
