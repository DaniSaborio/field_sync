"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  MapPin,
  Search,
  ShieldCheck,
  Trophy,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Row, RowTag } from "@/components/ui/row";
import { SectionLabel } from "@/components/ui/section-label";
import { fieldClassName, fieldLabelClassName, paymentMethodLabels, surfaceFilterLabels, timeSlotFilterLabels } from "./constants";
import { CourtResultCard, MatchPaymentChecklistModal } from "./match-payment-checklist";
import type { ApiResponse, AppUser, CourtCard, CourtReservation, PaymentMethod, TeamCard } from "./types";
import { readJson, todayIso } from "./utils";

export function BookingPanel({
  user,
  onRequireLogin,
  restrictToTenantId,
}: {
  user: AppUser | null;
  onRequireLogin?: () => void;
  restrictToTenantId?: number;
}) {
  const [date, setDate] = useState(todayIso());
  const [timeSlot, setTimeSlot] = useState("all");
  const [surface, setSurface] = useState("all");
  const [courtSearch, setCourtSearch] = useState("");
  const [courts, setCourts] = useState<CourtCard[]>([]);
  // Reservas propias, cargadas sin filtro de fecha: "Mis reservas" no debe
  // depender de qué fecha esté seleccionada en el buscador de disponibilidad,
  // o una reserva futura "desaparece" de la lista en cuanto ese filtro vuelve a hoy.
  const [myCourtsData, setMyCourtsData] = useState<CourtCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [checklistReservationId, setChecklistReservationId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/teams")
      .then((response) => readJson<ApiResponse<{ teams: TeamCard[] }>>(response))
      .then((payload) => setTeams(payload.teams ?? []))
      .catch(() => undefined);
  }, [user]);

  const myTeams = useMemo(
    () => (user ? teams.filter((team) => team.captainUserId === user.id) : []),
    [teams, user],
  );

  async function loadCourts() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/courts?${user ? `userId=${user.id}&` : ""}date=${date}&timeSlot=${timeSlot}&surface=${surface}`
      );
      const payload = await readJson<ApiResponse<{ courts: CourtCard[] }>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos cargar las canchas");
      }
      setCourts(payload.courts);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cargar las canchas");
    } finally {
      setBusy(false);
    }
  }

  async function loadMyReservations() {
    if (!user) {
      setMyCourtsData([]);
      return;
    }
    try {
      const response = await fetch(`/api/courts?userId=${user.id}`);
      const payload = await readJson<ApiResponse<{ courts: CourtCard[] }>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos cargar tus reservas");
      }
      setMyCourtsData(payload.courts);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cargar tus reservas");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCourts();
  }, [date, timeSlot, surface]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMyReservations();
  }, [user]);

  async function reserve(
    courtId: number,
    slot: string,
    paymentMethod: PaymentMethod,
    options?: { teamId?: number | null; splitPayment?: boolean; rivalTeamId?: number | null },
  ) {
    if (!user) {
      onRequireLogin?.();
      return;
    }

    if (!navigator.onLine) {
      setMessage("No es posible reservar sin conexión.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          courtId,
          date,
          timeSlot: slot,
          paymentMethod,
          teamId: options?.teamId ?? null,
          splitPayment: Boolean(options?.splitPayment),
          rivalTeamId: options?.rivalTeamId ?? null,
        }),
      });
      const payload = await readJson<ApiResponse<{ reservation?: CourtReservation; suggestedSlot?: string | null }>>(response);
      if (!response.ok) {
        throw new Error(
          payload.suggestedSlot
            ? `${payload.error || "Franja no disponible"}. Próxima franja libre: ${payload.suggestedSlot}`
            : payload.error || "No pudimos reservar"
        );
      }

      const parts = [`Reserva registrada con ${paymentMethodLabels[paymentMethod]}, pendiente de que el dueño de la cancha confirme el pago`];
      if (options?.splitPayment) parts.push("pago dividido notificado a la plantilla");
      if (options?.rivalTeamId) parts.push("rival invitado");
      setMessage(`${parts.join(", ")}.`);
      await Promise.all([loadCourts(), loadMyReservations()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos reservar");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(reservationId: number) {
    if (!user) {
      onRequireLogin?.();
      return;
    }

    if (!navigator.onLine) {
      setMessage("No es posible cancelar sin conexión.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/courts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, userId: user.id }),
      });
      const payload = await readJson<ApiResponse<{ reservation?: CourtReservation }>>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos cancelar");
      }

      setMessage("Reserva cancelada correctamente.");
      await Promise.all([loadCourts(), loadMyReservations()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cancelar");
    } finally {
      setBusy(false);
    }
  }

  const myReservations = useMemo(() => myCourtsData.flatMap((court) => court.reservations.map((reservation) => ({ ...reservation, courtName: court.name }))), [myCourtsData]);

  const filteredCourts = useMemo(() => {
    const scoped = restrictToTenantId ? courts.filter((court) => court.tenantId === restrictToTenantId) : courts;
    const query = courtSearch.trim().toLowerCase();
    if (!query) return scoped;
    return scoped.filter(
      (court) =>
        court.name.toLowerCase().includes(query) ||
        court.location.toLowerCase().includes(query)
    );
  }, [courts, courtSearch, restrictToTenantId]);

  const isNegativeMessage = /no pudimos|no es posible/i.test(message);

  const filtersSummary = `${timeSlotFilterLabels[timeSlot]} · ${surfaceFilterLabels[surface]}`;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <SectionLabel icon={MapPin}>Disponibilidad en tiempo real</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          <RowTag className="whitespace-nowrap" tone={busy ? "default" : "positive"}>
            {busy ? "Actualizando" : "Sincronizado"}
          </RowTag>
          {user ? (
            <RowTag className="whitespace-nowrap" tone={user.notificationsEnabled ? "positive" : "default"}>
              {user.notificationsEnabled ? "Notif. ON" : "Notif. OFF"}
            </RowTag>
          ) : null}
        </div>

        <div className="border border-black bg-paper p-4 shadow-hard">
          <label className="block space-y-1.5">
            <span className={fieldLabelClassName}>
              <CalendarDays size={13} strokeWidth={2} aria-hidden />
              Fecha de tu reserva
            </span>
            <input
              type="date"
              value={date}
              min={todayIso()}
              onChange={(event) => setDate(event.target.value)}
              className={`${fieldClassName} h-12 text-base font-bold`}
            />
          </label>
        </div>

        <CollapsibleSection icon={Filter} label="Más filtros" summary={filtersSummary}>
          <label className="block space-y-1.5">
            <span className={fieldLabelClassName}>
              <Search size={13} strokeWidth={2} aria-hidden />
              Buscar cancha
            </span>
            <input
              type="search"
              placeholder="Nombre o ubicación…"
              value={courtSearch}
              onChange={(event) => setCourtSearch(event.target.value)}
              className={fieldClassName}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={fieldLabelClassName}>
                <Clock3 size={13} strokeWidth={2} aria-hidden />
                Franja
              </span>
              <div className="relative">
                <select
                  value={timeSlot}
                  onChange={(event) => setTimeSlot(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="all">Todo el día</option>
                  <option value="morning">Mañana</option>
                  <option value="afternoon">Tarde</option>
                  <option value="night">Noche</option>
                </select>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black"
                  aria-hidden
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className={fieldLabelClassName}>
                <ShieldCheck size={13} strokeWidth={2} aria-hidden />
                Superficie
              </span>
              <div className="relative">
                <select
                  value={surface}
                  onChange={(event) => setSurface(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="all">Todas</option>
                  <option value="synthetic">Sintética</option>
                  <option value="natural">Natural</option>
                  <option value="indoor">Indoor</option>
                </select>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black"
                  aria-hidden
                />
              </div>
            </label>
          </div>
        </CollapsibleSection>

        {message ? (
          <div
            role={isNegativeMessage ? "alert" : "status"}
            className={`flex items-center gap-2 border border-black px-3 py-2 font-mono text-xs uppercase tracking-wider ${
              isNegativeMessage ? "bg-black text-paper" : "bg-paper text-black"
            }`}
          >
            {isNegativeMessage ? (
              <TriangleAlert size={14} strokeWidth={2} aria-hidden />
            ) : (
              <CheckCircle2 size={14} strokeWidth={2} aria-hidden />
            )}
            {message}
          </div>
        ) : null}
      </section>

      <section>
        <CollapsibleSection
          icon={CalendarDays}
          label="Mis reservas"
          summary={
            !user
              ? "Iniciá sesión para verlas"
              : myReservations.length > 0
                ? `${myReservations.length} reservas`
                : "Sin reservas activas"
          }
        >
          {!user ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-sans text-sm text-muted">
                Iniciá sesión para ver y gestionar tus reservas.
              </p>
              <Button variant="secondary" size="sm" onClick={onRequireLogin}>
                Iniciar sesión
              </Button>
            </div>
          ) : myReservations.length > 0 ? (
            <ul>
              {myReservations.map((reservation) => (
                <Row
                  key={reservation.id}
                  title={reservation.courtName}
                  meta={`${reservation.date} · ${reservation.timeSlot}${
                    reservation.paymentMethod ? ` · ${paymentMethodLabels[reservation.paymentMethod]}` : ""
                  }`}
                  disabled={reservation.status === "cancelada" || reservation.status === "rechazada"}
                  right={
                    reservation.status === "cancelada" ? (
                      <RowTag tone="negative">Cancelada</RowTag>
                    ) : reservation.status === "rechazada" ? (
                      <RowTag tone="negative">Pago rechazado</RowTag>
                    ) : (
                      <div className="flex items-center gap-2">
                        {reservation.status === "pendiente" ? (
                          <RowTag tone="default">Pendiente de confirmación</RowTag>
                        ) : null}
                        {reservation.status === "confirmada" && reservation.teamId && reservation.rivalTeamId ? (
                          reservation.matchClosed ? (
                            <RowTag tone="positive">Pagado</RowTag>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busy}
                              onClick={() => setChecklistReservationId(reservation.id)}
                            >
                              Verificar pagos
                            </Button>
                          )
                        ) : null}
                        {!reservation.matchClosed ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={busy}
                            onClick={() => cancel(reservation.id)}
                          >
                            Cancelar
                          </Button>
                        ) : null}
                      </div>
                    )
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              No tenés reservas activas todavía.
            </p>
          )}
        </CollapsibleSection>
      </section>

      <section>
        <SectionLabel icon={Trophy} className="mb-3">
          Canchas encontradas ({filteredCourts.length})
        </SectionLabel>

        {filteredCourts.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourts.map((court) => (
              <CourtResultCard
                key={court.id}
                court={court}
                date={date}
                busy={busy}
                canReserve={Boolean(user)}
                myTeams={myTeams}
                allTeams={teams}
                onReserve={reserve}
                onRequireLogin={onRequireLogin}
              />
            ))}
          </div>
        ) : (
          <div className="border border-black bg-paper p-8 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              No encontramos canchas que coincidan con la búsqueda.
            </p>
          </div>
        )}
      </section>

      <MatchPaymentChecklistModal
        open={checklistReservationId !== null}
        onClose={() => setChecklistReservationId(null)}
        reservationId={checklistReservationId}
        actingUserId={user?.id ?? 0}
      />
    </div>
  );
}

