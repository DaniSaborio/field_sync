"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Layers,
  Lightbulb,
  MapPin,
  Moon,
  Smartphone,
  Swords,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Row, RowCheckbox, RowTag } from "@/components/ui/row";
import { SectionLabel } from "@/components/ui/section-label";
import { isNightSlot } from "@/lib/utils";
import { paymentMethodLabels, fieldClassName } from "./constants";
import type { ApiResponse, CourtCard, PaymentMethod, TeamCard } from "./types";
import { formatDateTime, readJson, surfaceLabel } from "./utils";
import { MessageBanner } from "./shared-ui";

export function CourtResultCard({
  court,
  date,
  busy,
  canReserve,
  myTeams,
  allTeams,
  onReserve,
  onRequireLogin,
}: {
  court: CourtCard;
  date: string;
  busy: boolean;
  canReserve: boolean;
  myTeams: TeamCard[];
  allTeams: TeamCard[];
  onReserve: (
    courtId: number,
    slot: string,
    paymentMethod: PaymentMethod,
    options?: { teamId?: number | null; splitPayment?: boolean; rivalTeamId?: number | null },
  ) => void;
  onRequireLogin?: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [splitPayment, setSplitPayment] = useState(false);
  const [rivalTeamId, setRivalTeamId] = useState<number | null>(null);
  const hasSlots = court.availableSlots.length > 0;

  const selectedAmount =
    selectedSlot && isNightSlot(selectedSlot) && court.pricePerHourNight != null
      ? court.pricePerHourNight
      : court.pricePerHour;

  const selectedTeam = teamId ? myTeams.find((team) => team.id === teamId) ?? null : null;
  const perPersonAmount = selectedTeam
    ? (selectedAmount / Math.max(1, selectedTeam.playerIds.length)).toFixed(2)
    : null;

  function closeDetail() {
    setDetailOpen(false);
    setSelectedSlot(null);
    setPaymentMethod("efectivo");
    setTeamId(null);
    setSplitPayment(false);
    setRivalTeamId(null);
  }

  function handleSlotClick(slot: string) {
    if (!canReserve) {
      setDetailOpen(false);
      onRequireLogin?.();
      return;
    }
    setSelectedSlot(slot);
  }

  function handleConfirm() {
    if (!selectedSlot) return;
    onReserve(court.id, selectedSlot, paymentMethod, { teamId, splitPayment, rivalTeamId });
    closeDetail();
  }

  return (
    <>
      <Card className="gap-0 p-0">
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <span className={`size-6 shrink-0 border border-black ${hasSlots ? "bg-neon" : "bg-paper"}`} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-base font-black leading-tight tracking-tight text-black">
              {court.name}
            </span>
            <span className="mt-0.5 flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted">
              <MapPin size={11} strokeWidth={2} className="shrink-0" aria-hidden />
              <span className="truncate">
                {court.location} · ₡{court.pricePerHour}/h
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <RowTag className="whitespace-nowrap" tone={hasSlots ? "positive" : "default"}>
              {hasSlots ? `${court.availableSlots.length} libres` : "Sin cupo"}
            </RowTag>
            <ChevronDown size={16} strokeWidth={2} className="shrink-0 -rotate-90" aria-hidden />
          </span>
        </button>
      </Card>

      <Modal open={detailOpen} onClose={closeDetail} title={court.name}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
            <RowTag>{surfaceLabel(court.surface)}</RowTag>
            <RowTag
              tone={court.hasLights ? "night" : "default"}
              className="inline-flex items-center gap-1"
            >
              <Lightbulb size={11} strokeWidth={2} aria-hidden />
              {court.hasLights ? "Con luces" : "Sin luces"}
            </RowTag>
            <span className="flex items-center gap-1.5">
              <Users size={13} strokeWidth={2} aria-hidden />
              {court.capacity}
            </span>
            <span className="flex items-center gap-1">
              <BadgeCheck size={13} strokeWidth={2} aria-hidden />
              {court.rating.toFixed(1)}
            </span>
            <span className="font-black text-black">₡{court.pricePerHour}/h</span>
          </div>

          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
            <MapPin size={13} strokeWidth={2} aria-hidden />
            {court.location}
          </p>

          {court.mapsUrl ? (
            <a
              href={court.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-black underline underline-offset-4"
            >
              <ExternalLink size={12} strokeWidth={2} aria-hidden />
              Ver en el mapa
            </a>
          ) : null}

          {!selectedSlot ? (
            <div className="space-y-2 border-t border-black pt-4">
              <SectionLabel icon={Clock3}>Horarios disponibles</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {hasSlots ? (
                  court.availableSlots.map((slot) => {
                    const isNight = isNightSlot(slot);
                    return (
                      <Button
                        key={`${court.id}-${slot}`}
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleSlotClick(slot)}
                        className={isNight ? "gap-1 bg-night text-paper" : undefined}
                      >
                        {isNight ? <Moon size={12} strokeWidth={2.5} aria-hidden /> : null}
                        {slot}
                      </Button>
                    );
                  })
                ) : (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    Sin horarios libres
                  </p>
                )}
              </div>
              {court.availableSlots.some(isNightSlot) ? (
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                  <Moon size={12} strokeWidth={2} className="text-night" aria-hidden />
                  {court.pricePerHourNight != null
                    ? `Horario nocturno (18:00+) a ₡${court.pricePerHourNight}/h`
                    : "Horario nocturno (18:00+) con tarifa más alta"}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 border-t border-black pt-4">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black"
              >
                <ChevronLeft size={14} strokeWidth={2} aria-hidden />
                Elegir otro horario
              </button>

              <div className="border border-black bg-paper p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Resumen</p>
                <p className="mt-1 flex items-center gap-1.5 font-sans text-sm font-semibold text-black">
                  {court.name} · {date} · {selectedSlot}
                  {isNightSlot(selectedSlot) ? (
                    <RowTag tone="night" className="inline-flex items-center gap-1">
                      <Moon size={10} strokeWidth={2.5} aria-hidden />
                      Nocturno
                    </RowTag>
                  ) : null}
                </p>
                <p className="mt-1 font-mono text-lg font-black tabular-nums text-black">
                  ₡{selectedAmount}
                </p>
                {isNightSlot(selectedSlot) ? (
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                    {court.pricePerHourNight != null
                      ? "Los horarios nocturnos tienen una tarifa más alta"
                      : "Horario nocturno (esta cancha aún no tiene tarifa nocturna configurada)"}
                  </p>
                ) : null}
              </div>

              {myTeams.length > 0 ? (
                <div>
                  <SectionLabel icon={Users}>Plantilla (opcional)</SectionLabel>
                  <div className="relative mt-2">
                    <select
                      value={teamId ?? ""}
                      onChange={(event) => {
                        const value = event.target.value ? Number(event.target.value) : null;
                        setTeamId(value);
                        if (!value) setSplitPayment(false);
                      }}
                      className={fieldClassName}
                    >
                      <option value="">Sin plantilla</option>
                      {myTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.playerIds.length} jugadores)
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black"
                      aria-hidden
                    />
                  </div>

                  {selectedTeam ? (
                    <>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={!splitPayment ? "default" : "secondary"}
                          onClick={() => setSplitPayment(false)}
                        >
                          Pago individual
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={splitPayment ? "default" : "secondary"}
                          onClick={() => setSplitPayment(true)}
                        >
                          Pago dividido
                        </Button>
                      </div>
                      {splitPayment ? (
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                          Se notifica a cada integrante de {selectedTeam.name} su parte: ₡{perPersonAmount}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}

              {allTeams.length > 0 ? (
                <div>
                  <SectionLabel icon={Swords}>Invitar plantilla rival (opcional)</SectionLabel>
                  <div className="relative mt-2">
                    <select
                      value={rivalTeamId ?? ""}
                      onChange={(event) =>
                        setRivalTeamId(event.target.value ? Number(event.target.value) : null)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Sin invitar</option>
                      {allTeams
                        .filter((team) => team.id !== teamId)
                        .map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black"
                      aria-hidden
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <SectionLabel icon={Banknote}>Método de pago</SectionLabel>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "sinpe" ? "default" : "secondary"}
                    onClick={() => setPaymentMethod("sinpe")}
                  >
                    <Smartphone size={16} strokeWidth={2} aria-hidden />
                    SINPE
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "efectivo" ? "default" : "secondary"}
                    onClick={() => setPaymentMethod("efectivo")}
                  >
                    <Banknote size={16} strokeWidth={2} aria-hidden />
                    Efectivo
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "mixto" ? "default" : "secondary"}
                    onClick={() => setPaymentMethod("mixto")}
                  >
                    <Layers size={16} strokeWidth={2} aria-hidden />
                    Mixto
                  </Button>
                </div>
              </div>

              <Button type="button" className="w-full" disabled={busy} onClick={handleConfirm}>
                {busy ? "Confirmando…" : `Confirmar reserva · ${paymentMethodLabels[paymentMethod]}`}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

type MatchPaymentPlayer = { id: number; name: string; teamId: number; paid: boolean; paidAt: string | null };
type MatchPaymentChecklist = {
  reservationId: number;
  courtName: string;
  date: string;
  timeSlot: string;
  amount: number | null;
  perPersonAmount: number | null;
  homeTeam: { id: number; name: string; players: MatchPaymentPlayer[] };
  rivalTeam: { id: number; name: string; players: MatchPaymentPlayer[] };
  allPaid: boolean;
  closed: boolean;
  closedAt: string | null;
  closedByName: string | null;
};

function TeamChecklistSection({
  team,
  perPersonAmount,
  busy,
  onToggle,
}: {
  team: MatchPaymentChecklist["homeTeam"];
  perPersonAmount: number | null;
  busy: boolean;
  onToggle: (playerId: number, paid: boolean) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{team.name}</p>
      <ul className="mt-1">
        {team.players.map((player) => (
          <Row
            key={player.id}
            left={
              <RowCheckbox
                checked={player.paid}
                onCheckedChange={(checked) => onToggle(player.id, checked)}
                disabled={busy}
                aria-label={`Pago de ${player.name}`}
              />
            }
            title={player.name}
            meta={player.paid ? "Pagado" : "Pendiente"}
            right={perPersonAmount ? <span className="font-mono text-[11px] tabular-nums text-muted">₡{perPersonAmount}</span> : null}
          />
        ))}
      </ul>
    </div>
  );
}

export function MatchPaymentChecklistModal({
  open,
  onClose,
  reservationId,
  actingUserId,
}: {
  open: boolean;
  onClose: () => void;
  reservationId: number | null;
  actingUserId: number;
}) {
  const [checklist, setChecklist] = useState<MatchPaymentChecklist | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadChecklist() {
    if (!reservationId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/matches/payments?reservationId=${reservationId}`);
      const payload = await readJson<ApiResponse<{ checklist?: MatchPaymentChecklist }>>(response);
      if (!response.ok || !payload.checklist) {
        throw new Error(payload.error || "No pudimos cargar el checklist de pagos");
      }
      setChecklist(payload.checklist);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cargar el checklist de pagos");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (open && reservationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadChecklist();
    }
  }, [open, reservationId]);

  async function togglePlayer(playerId: number, paid: boolean) {
    if (!reservationId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/matches/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, playerId, paid, actingUserId }),
      });
      const payload = await readJson<ApiResponse<{ checklist?: MatchPaymentChecklist }>>(response);
      if (!response.ok || !payload.checklist) {
        throw new Error(payload.error || "No pudimos actualizar el checklist de pagos");
      }
      setChecklist(payload.checklist);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos actualizar el checklist de pagos");
    } finally {
      setBusy(false);
    }
  }

  async function closeMatch() {
    if (!reservationId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/matches/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, actingUserId }),
      });
      const payload = await readJson<ApiResponse<{ checklist?: MatchPaymentChecklist }>>(response);
      if (!response.ok || !payload.checklist) {
        throw new Error(payload.error || "No pudimos cerrar el pago del partido");
      }
      setChecklist(payload.checklist);
      setMessage("Pago del partido cerrado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cerrar el pago del partido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Checklist de pago">
      {message ? <MessageBanner message={message} /> : null}
      {checklist ? (
        <div className="space-y-4">
          <div className="border border-black bg-paper p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {checklist.courtName} · {checklist.date} · {checklist.timeSlot}
            </p>
            <p className="mt-1 flex items-center gap-2 font-sans text-sm font-semibold text-black">
              {checklist.homeTeam.name} vs {checklist.rivalTeam.name}
              {checklist.closed ? (
                <RowTag tone="positive">Cerrado</RowTag>
              ) : checklist.allPaid ? (
                <RowTag>Listo para cerrar</RowTag>
              ) : (
                <RowTag>En curso</RowTag>
              )}
            </p>
            {checklist.closed ? (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                Cerrado por {checklist.closedByName ?? "—"}
                {checklist.closedAt ? ` · ${formatDateTime(checklist.closedAt)}` : ""}
              </p>
            ) : null}
          </div>

          <TeamChecklistSection
            team={checklist.homeTeam}
            perPersonAmount={checklist.perPersonAmount}
            busy={busy || checklist.closed}
            onToggle={togglePlayer}
          />
          <TeamChecklistSection
            team={checklist.rivalTeam}
            perPersonAmount={checklist.perPersonAmount}
            busy={busy || checklist.closed}
            onToggle={togglePlayer}
          />

          {!checklist.closed ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {checklist.allPaid
                  ? "Todos los jugadores están marcados como pagados. Confirmá el cierre para saldar el partido."
                  : "Marcá a cada jugador cuando confirmes su parte. El cierre se habilita cuando todos estén pagados."}
              </p>
              <Button type="button" className="w-full" disabled={busy || !checklist.allPaid} onClick={closeMatch}>
                {busy ? "Procesando…" : "Confirmar cierre"}
              </Button>
            </>
          ) : null}
        </div>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {busy ? "Cargando…" : "No pudimos cargar el checklist."}
        </p>
      )}
    </Modal>
  );
}

