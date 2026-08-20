"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Row } from "@/components/ui/row";
import { paymentMethodLabels } from "./constants";
import { MatchPaymentChecklistModal } from "./match-payment-checklist";
import { MessageBanner, PanelShell, StatusPill } from "./shared-ui";
import type { ApiResponse, AppUser, CourtCard } from "./types";
import { readJson } from "./utils";

export function TenantPaymentsPanel({ user }: { user: AppUser }) {
  const [courts, setCourts] = useState<CourtCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCourts() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/courts");
      const payload = await readJson<ApiResponse<{ courts: CourtCard[] }>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos cargar las reservas");
      }
      setCourts(payload.courts ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cargar las reservas");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCourts();
  }, []);

  const [checklistReservationId, setChecklistReservationId] = useState<number | null>(null);

  const myCourts = useMemo(() => courts.filter((court) => court.tenantId === user.id), [courts, user.id]);
  const pendingReservations = useMemo(
    () =>
      myCourts.flatMap((court) =>
        court.reservations
          .filter((reservation) => reservation.status === "pendiente")
          .map((reservation) => ({ ...reservation, courtName: court.name })),
      ),
    [myCourts],
  );
  const matchesWithRival = useMemo(
    () =>
      myCourts.flatMap((court) =>
        court.reservations
          .filter(
            (reservation) =>
              reservation.status === "confirmada" &&
              reservation.teamId &&
              reservation.rivalTeamId &&
              !reservation.matchClosed,
          )
          .map((reservation) => ({ ...reservation, courtName: court.name })),
      ),
    [myCourts],
  );

  async function respond(reservationId: number, action: "confirm" | "reject") {
    let reason: string | null = null;
    if (action === "reject") {
      reason = window.prompt("Motivo del rechazo del pago:");
      if (!reason || !reason.trim()) return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/courts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, tenantId: user.id, action, reason }),
      });
      const payload = await readJson<ApiResponse<Record<string, unknown>>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos procesar la verificación");
      }
      setMessage(action === "confirm" ? "Pago confirmado, reserva aceptada." : "Reserva rechazada.");
      await loadCourts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos procesar la verificación");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelShell
      title="Pagos pendientes"
      description="Verificá el pago declarado (SINPE o efectivo) antes de aceptar cada reserva."
      action={<StatusPill>{pendingReservations.length} por revisar</StatusPill>}
    >
      {message ? <MessageBanner message={message} /> : null}
      {pendingReservations.length > 0 ? (
        <ul>
          {pendingReservations.map((reservation) => (
            <Row
              key={reservation.id}
              title={reservation.playerName ? `${reservation.playerName} · ${reservation.courtName}` : reservation.courtName}
              meta={`${reservation.playerEmail ? `${reservation.playerEmail} · ` : ""}${reservation.date} · ${reservation.timeSlot}${
                reservation.paymentMethod ? ` · ${paymentMethodLabels[reservation.paymentMethod]}` : ""
              }${reservation.amount ? ` · ₡${reservation.amount}` : ""}`}
              right={
                <div className="flex items-center gap-2">
                  <Button size="sm" disabled={busy} onClick={() => respond(reservation.id, "confirm")}>
                    Confirmar reserva
                  </Button>
                  <Button variant="destructive" size="sm" disabled={busy} onClick={() => respond(reservation.id, "reject")}>
                    Rechazar
                  </Button>
                </div>
              }
            />
          ))}
        </ul>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
          No hay pagos pendientes de verificación.
        </p>
      )}

      {matchesWithRival.length > 0 ? (
        <div className="mt-6 border-t border-black pt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            Partidos con plantilla rival
          </p>
          <ul>
            {matchesWithRival.map((reservation) => (
              <Row
                key={reservation.id}
                title={reservation.playerName ? `${reservation.playerName} · ${reservation.courtName}` : reservation.courtName}
                meta={`${reservation.date} · ${reservation.timeSlot}`}
                right={
                  <Button variant="secondary" size="sm" onClick={() => setChecklistReservationId(reservation.id)}>
                    Verificar pagos
                  </Button>
                }
              />
            ))}
          </ul>
        </div>
      ) : null}

      <MatchPaymentChecklistModal
        open={checklistReservationId !== null}
        onClose={() => setChecklistReservationId(null)}
        reservationId={checklistReservationId}
        actingUserId={user.id}
      />
    </PanelShell>
  );
}

