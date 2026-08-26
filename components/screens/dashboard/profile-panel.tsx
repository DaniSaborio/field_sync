"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Row, RowTag } from "@/components/ui/row";
import { fieldClassName } from "./constants";
import { Badge, MessageBanner, PanelShell, PushSubscribeButton, StatusPill } from "./shared-ui";
import type { AnyProfileSnapshot, ApiResponse, AppUser } from "./types";
import { displayName, humanRole, readJson } from "./utils";

type ProfilePanelProps = {
  user: AppUser;
  onRequestTenant: () => void;
  onUserUpdate: (user: AppUser) => void;
};

export function ProfilePanel({user, onRequestTenant, onUserUpdate}: ProfilePanelProps) {
  const [profile, setProfile] = useState<AnyProfileSnapshot | null>(null);
  const [message, setMessage] = useState("");
  const [nicknameDraft, setNicknameDraft] = useState("");

  async function loadProfile() {
    const response = await fetch(`/api/profile?userId=${user.id}`);
    const payload = await readJson<ApiResponse<AnyProfileSnapshot>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar el perfil");
    }
    setProfile(payload);
    setNicknameDraft(payload.user.nickname ?? "");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile().catch((error) => setMessage(error instanceof Error ? error.message : "No pudimos cargar el perfil"));
  }, []);

  async function saveNickname() {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, nickname: nicknameDraft.trim() || null }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos actualizar el apodo");
      return;
    }
    setMessage("Apodo actualizado.");
    onUserUpdate({ ...user, nickname: nicknameDraft.trim() || undefined });
    await loadProfile();
  }

  async function updateVisibility(nextVisibility: "public" | "private") {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, visibility: nextVisibility }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos actualizar la privacidad");
      return;
    }
    setMessage("Privacidad actualizada.");
    await loadProfile();
  }

  async function updateNotifications(enabled: boolean) {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, notificationsEnabled: enabled }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos actualizar las notificaciones");
      return;
    }
    setMessage("Preferencias de notificaciones actualizadas.");
    await loadProfile();
  }

  if (profile?.kind === "tenant") {
    const totalPending = profile.courts.reduce((sum, court) => sum + court.pendingCount, 0);

    return (
      <PanelShell
        title="Perfil de la cancha"
        description="Tus canchas, reservas por confirmar e ingresos verificados."
        action={<StatusPill>{profile.user.notificationsEnabled ? "Notif. ON" : "Notif. OFF"}</StatusPill>}
      >
        {message ? <MessageBanner message={message} /> : null}
        <div className="grid gap-4 xl:grid-cols-3">
          <Card nested>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Dueño de cancha</p>
            <h3 className="mt-2 font-display text-xl font-black leading-tight tracking-tight text-black">{displayName(profile.user)}</h3>
            <p className="font-sans text-sm text-muted">{profile.user.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                placeholder="Apodo (opcional)"
                maxLength={50}
                className={`${fieldClassName} h-9 flex-1`}
              />
              <Button type="button" size="sm" variant="secondary" onClick={saveNickname}>Guardar</Button>
            </div>
            <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => updateNotifications(!profile.user.notificationsEnabled)}>
              {profile.user.notificationsEnabled ? "Desactivar notificaciones" : "Activar notificaciones"}
            </Button>
            <PushSubscribeButton userId={profile.user.id} />
          </Card>
          <Card nested className="xl:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Resumen</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div><p className="font-mono text-2xl font-black tabular-nums text-black">{profile.courts.length}</p><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Canchas</p></div>
              <div><p className="font-mono text-2xl font-black tabular-nums text-black">{totalPending}</p><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Pagos por revisar</p></div>
              <div><p className="font-mono text-2xl font-black tabular-nums text-black">₡{profile.courts.reduce((sum, court) => sum + court.verifiedRevenue, 0)}</p><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Verificado</p></div>
            </div>
          </Card>
          <Card nested className="xl:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Mis canchas</p>
            {profile.courts.length > 0 ? (
              <ul className="mt-2">
                {profile.courts.map((court) => (
                  <Row
                    key={court.id}
                    title={court.name}
                    meta={`${court.address ?? "Sin dirección"}${court.pricePerHour ? ` · ₡${court.pricePerHour}/h` : ""}`}
                    right={
                      <div className="flex items-center gap-2">
                        {court.pendingCount > 0 ? <RowTag tone="default">{court.pendingCount} por revisar</RowTag> : null}
                        <RowTag tone="positive">{court.confirmedCount} confirmadas</RowTag>
                      </div>
                    }
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted">Todavía no tenés canchas registradas.</p>
            )}
          </Card>
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Perfil global"
      description="Estadísticas acumuladas, torneos disputados y privacidad."
      action={<StatusPill>{profile?.profile.visibility ?? "public"}</StatusPill>}
    >
      {message ? <MessageBanner message={message} /> : null}
      {profile ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card nested>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Jugador</p>
            <h3 className="mt-2 font-display text-xl font-black leading-tight tracking-tight text-black">{displayName(profile.user)}</h3>
            <p className="font-sans text-sm text-muted">{profile.user.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                placeholder="Apodo (opcional)"
                maxLength={50}
                className={`${fieldClassName} h-9 flex-1`}
              />
              <Button type="button" size="sm" variant="secondary" onClick={saveNickname}>Guardar</Button>
            </div>
            <p className="font-sans text-sm text-black">Notificaciones: {profile.user.notificationsEnabled ? "activas" : "desactivadas"}</p>
          </Card>
          <Card nested>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Estadísticas</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div><p className="font-mono text-2xl font-black tabular-nums text-black">{profile.profile.goals}</p><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Goles</p></div>
              <div><p className="font-mono text-2xl font-black tabular-nums text-black">{profile.profile.assists}</p><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Asistencias</p></div>
              <div><p className="font-mono text-2xl font-black tabular-nums text-black">{profile.profile.matchesPlayed}</p><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Partidos</p></div>
            </div>
          </Card>
          {/* NUEVA TARJETA */}

          <Card nested>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
             Conviértete en dueño de cancha
            </p>
            <h3 className="mt-2 font-display text-xl font-black leading-tight tracking-tight text-black">
              Administra tus propias canchas
            </h3>
            <p className="mt-2 text-sm text-muted">
               Solicita convertirte en dueño de cancha para administrar tus instalaciones,
                reservas, horarios e ingresos desde un panel exclusivo para dueños de canchas.
            </p>
           <Button
             type="button"
             size="sm"
              className="mt-4"
              onClick={onRequestTenant}
              >
             Solicitar ser dueño de cancha
            </Button>
          </Card>

          <Card nested>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Privacidad</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={profile.profile.visibility === "public" ? "default" : "secondary"} onClick={() => updateVisibility("public")}>Público</Button>
              <Button type="button" size="sm" variant={profile.profile.visibility === "private" ? "default" : "secondary"} onClick={() => updateVisibility("private")}>Privado</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => updateNotifications(!profile.user.notificationsEnabled)}>
                {profile.user.notificationsEnabled ? "Desactivar notificaciones" : "Activar notificaciones"}
              </Button>
            </div>
            <PushSubscribeButton userId={profile.user.id} />
          </Card>
          <Card nested className="xl:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Torneos y canchas vinculadas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.tournaments.map((tournament) => <Badge key={tournament}>{tournament}</Badge>)}
              {profile.courts.map((court) => <Badge key={court}>{court}</Badge>)}
            </div>
          </Card>
        </div>
      ) : (
        <div className="border border-black bg-paper p-8 text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-black">Cargando…</p>
        </div>
      )}
    </PanelShell>
  );
}

