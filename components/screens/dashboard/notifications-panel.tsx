"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { Row } from "@/components/ui/row";
import { Badge, MessageBanner, PanelShell, StatusPill } from "./shared-ui";
import type { ApiResponse, AppUser, NotificationCard } from "./types";
import { formatDateTime, readJson } from "./utils";

function notificationTypeLabel(type: string) {
  switch (type) {
    case "reservation":
      return "Reserva";
    case "cancellation":
      return "Cancelación";
    case "tournament":
      return "Torneo";
    case "convocation":
      return "Convocatoria";
    case "match-result":
      return "Resultado";
    case "payment-split":
      return "Pago dividido";
    case "match-invite":
      return "Invitación";
    case "account-status":
      return "Estado de cuenta";
    default:
      return type;
  }
}

export function NotificationsPanel({ user }: { user: AppUser }) {
  const [notifications, setNotifications] = useState<NotificationCard[]>([]);
  const [message, setMessage] = useState("");

  async function loadNotifications() {
    const response = await fetch(`/api/notifications?userId=${user.id}`);
    const payload = await readJson<ApiResponse<{ notifications: NotificationCard[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar las notificaciones");
    }
    setNotifications(
      [...payload.notifications].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNotifications().catch((error) => setMessage(error instanceof Error ? error.message : "No pudimos cargar las notificaciones"));
    const interval = setInterval(() => {
      void loadNotifications().catch(() => undefined);
    }, 15000);
    return () => clearInterval(interval);
  }, [user.id]);

  return (
    <PanelShell
      title="Notificaciones"
      description="Confirmaciones de reserva, resultados de partidos y convocatorias."
      action={<StatusPill>{notifications.length} en total</StatusPill>}
    >
      {message ? <MessageBanner message={message} /> : null}
      {!user.notificationsEnabled ? (
        <div className="mb-4 flex items-center gap-2 border border-black bg-black px-3 py-2 font-mono text-xs uppercase tracking-wider text-paper">
          <Bell size={14} strokeWidth={2} aria-hidden />
          Tenés las notificaciones desactivadas desde tu perfil. Activalas para recibir nuevos avisos.
        </div>
      ) : null}
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((notification) => (
            <Row
              key={notification.id}
              title={notification.message}
              meta={formatDateTime(notification.createdAt)}
              right={<Badge>{notificationTypeLabel(notification.type)}</Badge>}
            />
          ))}
        </ul>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">No tenés notificaciones todavía.</p>
      )}
    </PanelShell>
  );
}

