"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Filter,
  LogIn,
  LogOut,
  Minus,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  Users,
  Trophy,
  Settings2,
  MapPin,
  Swords,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Modal } from "@/components/ui/modal";
import { Row, RowCheckbox, RowTag } from "@/components/ui/row";
import { SectionLabel } from "@/components/ui/section-label";
import { cn, isNightSlot } from "@/lib/utils";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  sinpe: "SINPE Móvil",
  efectivo: "Efectivo",
};

const fieldClassName =
  "h-11 w-full appearance-none border border-black bg-paper px-3 text-sm font-medium text-black outline-none focus:outline-2 focus:outline-black focus:outline-offset-2";

const fieldLabelClassName =
  "flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted";

const timeSlotFilterLabels: Record<string, string> = {
  all: "Todo el día",
  morning: "Mañana",
  afternoon: "Tarde",
  night: "Noche",
};

const surfaceFilterLabels: Record<string, string> = {
  all: "Todas",
  synthetic: "Sintética",
  natural: "Natural",
  indoor: "Indoor",
};

export type AppUser = {
  id: number;
  fullName: string;
  nickname?: string | null;
  email: string;
  role: string;
  // Los jugadores y administradores de plataforma no pertenecen a un tenant fijo;
  // solo los usuarios con rol "tenant" tienen id_user propio como identificador de cancha.
  tenantId?: number | null;
  notificationsEnabled: boolean;
};

type PaymentMethod = "sinpe" | "efectivo";
type PaymentStatus = "pendiente" | "verificado" | "rechazado";

type CourtReservation = {
  id: number;
  userId: number;
  courtId: number;
  date: string;
  timeSlot: string;
  status: "pendiente" | "confirmada" | "rechazada" | "cancelada";
  createdAt: string;
  paymentMethod?: PaymentMethod | null;
  paymentStatus?: PaymentStatus | null;
  amount?: number | null;
};

type CourtCard = {
  id: number;
  tenantId: number;
  name: string;
  location: string;
  mapsUrl?: string | null;
  surface: "synthetic" | "natural" | "indoor";
  capacity: string;
  pricePerHour: number;
  pricePerHourNight: number | null;
  rating: number;
  availableSlots: string[];
  reservations: CourtReservation[];
};

type MatchStat = {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  goals: number;
  yellowCards: number;
  redCards: number;
};

type TournamentMatch = {
  id: number;
  tournamentId: number;
  homeTeamId: number;
  awayTeamId: number;
  scheduledAt: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: "scheduled" | "confirmed";
  resultLocked: boolean;
  auditTrail: string[];
  stats: MatchStat[];
};

type Standing = {
  teamId: number;
  tournamentId: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

type TournamentCard = {
  id: number;
  createdByUserId: number;
  courtId: number;
  name: string;
  format: string;
  fixtureMode: "aleatorio" | "manual";
  teamsRequired: number;
  startDate: string;
  endDate: string;
  status: "draft" | "active";
  requestStatus: "pendiente" | "aprobado" | "rechazado";
  rejectionReason: string | null;
  teamIds: number[];
  fixture: TournamentMatch[];
  standings: Standing[];
};

type TeamCard = {
  id: number;
  name: string;
  captainUserId: number;
  playerIds: number[];
  players: Array<{ id: number; fullName: string; nickname?: string | null; email: string } | null>;
};

type UserOption = {
  id: number;
  fullName: string;
  nickname?: string | null;
  email: string;
  role: string;
};

type ProfileSnapshot = {
  kind?: "jugador";
  user: AppUser;
  profile: {
    id: number;
    userId: number;
    goals: number;
    assists: number;
    matchesPlayed: number;
    tournaments: string[];
    courts: string[];
    visibility: "public" | "private";
  };
  tournaments: string[];
  courts: string[];
  standings: Standing[];
};

type OwnedCourtSummary = {
  id: number;
  name: string;
  address: string | null;
  pricePerHour: number | null;
  rating: number | null;
  pendingCount: number;
  confirmedCount: number;
  verifiedRevenue: number;
};

type TenantProfileSnapshot = {
  kind: "tenant";
  user: { id: number; fullName: string; nickname?: string | null; email: string; role: string; notificationsEnabled: boolean };
  courts: OwnedCourtSummary[];
};

type AnyProfileSnapshot = ProfileSnapshot | TenantProfileSnapshot;

type DashboardScreenProps = {
  user: AppUser;
  onLogout: () => void;
  onUserUpdate: (user: AppUser) => void;
};

type ApiResponse<T> = {
  ok?: boolean;
  error?: string;
} & T;

type NotificationCard = {
  id: number;
  userId: number;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const tabButtons = [
  { id: "reservas", label: "Reservas", icon: MapPin },
  { id: "torneos", label: "Torneos", icon: Trophy },
  { id: "perfil", label: "Perfil", icon: Settings2 },
  { id: "plantilla", label: "Plantilla", icon: Users },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
] as const;

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function surfaceLabel(surface: CourtCard["surface"]) {
  if (surface === "synthetic") return "Sintética";
  if (surface === "natural") return "Natural";
  return "Indoor";
}

function humanRole(role: string) {
  switch (role) {
    case "administrador":
    case "admin_plataforma":
      return "Administrador";
    case "recepcionista":
      return "Recepcionista";
    case "organizador":
      return "Organizador";
    case "tenant":
      return "Dueño de cancha";
    default:
      return "Jugador";
  }
}

function isAdmin(user: AppUser) {
  return user.role === "administrador" || user.role === "admin_plataforma";
}

// Muestra el apodo junto al nombre completo para diferenciar jugadores que comparten nombre.
function displayName(person: { fullName: string; nickname?: string | null }) {
  return person.nickname ? `${person.fullName} "${person.nickname}"` : person.fullName;
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-black bg-paper px-1.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-black">
      <BadgeCheck size={12} strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

function PanelShell({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <section className="border border-black bg-paper p-4 shadow-hard sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-black pb-4">
        <div>
          <h2 className="font-display text-xl font-black leading-tight tracking-tight text-black">{title}</h2>
          <p className="mt-1 font-sans text-sm text-muted">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-black bg-paper px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
      {children}
    </span>
  );
}

function MessageBanner({ message }: { message: string }) {
  const isNegative = /no pudimos|no es posible|no fue posible/i.test(message);
  return (
    <div
      role={isNegative ? "alert" : "status"}
      className={`mb-4 flex items-center gap-2 border border-black px-3 py-2 font-mono text-xs uppercase tracking-wider ${
        isNegative ? "bg-black text-paper" : "bg-paper text-black"
      }`}
    >
      {isNegative ? (
        <TriangleAlert size={14} strokeWidth={2} aria-hidden />
      ) : (
        <CheckCircle2 size={14} strokeWidth={2} aria-hidden />
      )}
      {message}
    </div>
  );
}

function CourtResultCard({
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
                {court.location} · ${court.pricePerHour}/h
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
            <span className="flex items-center gap-1.5">
              <Users size={13} strokeWidth={2} aria-hidden />
              {court.capacity}
            </span>
            <span className="flex items-center gap-1">
              <BadgeCheck size={13} strokeWidth={2} aria-hidden />
              {court.rating.toFixed(1)}
            </span>
            <span className="font-black text-black">${court.pricePerHour}/h</span>
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
                    ? `Horario nocturno (18:00+) a $${court.pricePerHourNight}/h`
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
                  ${selectedAmount}
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
                          Se notifica a cada integrante de {selectedTeam.name} su parte: ${perPersonAmount}
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
                <div className="mt-2 grid grid-cols-2 gap-2">
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

function BookingPanel({
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [teams, setTeams] = useState<TeamCard[]>([]);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCourts();
  }, [date, timeSlot, surface]);

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
      await loadCourts();
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
      await loadCourts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos cancelar");
    } finally {
      setBusy(false);
    }
  }

  const myReservations = useMemo(() => courts.flatMap((court) => court.reservations.map((reservation) => ({ ...reservation, courtName: court.name }))), [courts]);

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
        <SectionLabel icon={CalendarDays} className="mb-3">
          Mis reservas
        </SectionLabel>

        <Card>
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
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busy}
                          onClick={() => cancel(reservation.id)}
                        >
                          Cancelar
                        </Button>
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
        </Card>
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
    </div>
  );
}

export function GuestBookingScreen({ onRequireLogin }: { onRequireLogin: () => void }) {
  return (
    <div className="min-h-screen bg-paper font-sans">
      <header className="border-b border-black bg-paper px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center bg-black px-1.5 py-px font-mono text-[10px] font-bold uppercase tracking-wider text-paper">
              Explorando como invitado
            </span>
            <h1 className="mt-3 font-display text-3xl font-black leading-none tracking-tight text-black sm:text-4xl">
              Reserva tu cancha
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Mirá la disponibilidad en tiempo real. Iniciá sesión para confirmar una reserva.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={onRequireLogin}
            className="self-start lg:self-auto"
          >
            <LogIn size={14} aria-hidden />
            Iniciar sesión
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <BookingPanel user={null} onRequireLogin={onRequireLogin} />
      </div>
    </div>
  );
}

function PlayerStatRow({
  name,
  stat,
  onChange,
}: {
  name: string;
  stat: { goals: number; yellowCards: number; redCards: number };
  onChange: (patch: Partial<{ goals: number; yellowCards: number; redCards: number }>) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-black py-2 last:border-b-0">
      <p className="min-w-0 truncate text-sm font-semibold text-black">{name}</p>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Quitar gol"
            disabled={stat.goals === 0}
            onClick={() => onChange({ goals: stat.goals - 1 })}
            className="flex size-6 items-center justify-center border border-black disabled:opacity-40"
          >
            <Minus size={12} strokeWidth={2.5} aria-hidden />
          </button>
          <span className="w-5 text-center font-mono text-sm font-black tabular-nums text-black">{stat.goals}</span>
          <button
            type="button"
            aria-label="Agregar gol"
            onClick={() => onChange({ goals: stat.goals + 1 })}
            className="flex size-6 items-center justify-center border border-black bg-neon"
          >
            <Plus size={12} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onChange({ yellowCards: stat.yellowCards > 0 ? 0 : 1 })}
          className={cn(
            "border border-black px-1.5 py-1.5 font-mono text-[10px] font-black uppercase",
            stat.yellowCards > 0 ? "bg-black text-paper" : "bg-paper text-black",
          )}
        >
          TA
        </button>
        <button
          type="button"
          onClick={() => onChange({ redCards: stat.redCards > 0 ? 0 : 1 })}
          className={cn(
            "border border-black px-1.5 py-1.5 font-mono text-[10px] font-black uppercase",
            stat.redCards > 0 ? "bg-black text-paper" : "bg-paper text-black",
          )}
        >
          TR
        </button>
      </div>
    </div>
  );
}

function TournamentsPanel({ user }: { user: AppUser }) {
  const [data, setData] = useState<{ tournaments: TournamentCard[]; matches: TournamentMatch[]; standings: Standing[] }>({ tournaments: [], matches: [], standings: [] });
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [courts, setCourts] = useState<CourtCard[]>([]);
  const [message, setMessage] = useState("");
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<{
    name: string;
    format: string;
    fixtureMode: "aleatorio" | "manual";
    courtId: number | null;
    teamIds: number[];
    startDate: string;
    endDate: string;
  }>({
    name: "",
    format: "todos-contra-todos",
    fixtureMode: "aleatorio",
    courtId: null,
    teamIds: [],
    startDate: todayIso(),
    endDate: todayIso(),
  });
  const [manualPairs, setManualPairs] = useState<Array<{ homeTeamId: number; awayTeamId: number }>>([]);
  const [manualPairDraft, setManualPairDraft] = useState<{ homeTeamId: number | null; awayTeamId: number | null }>({
    homeTeamId: null,
    awayTeamId: null,
  });

  function toggleCreateFormTeam(teamId: number) {
    setCreateForm((current) => ({
      ...current,
      teamIds: current.teamIds.includes(teamId)
        ? current.teamIds.filter((id) => id !== teamId)
        : [...current.teamIds, teamId],
    }));
  }
  const [resultModalMatch, setResultModalMatch] = useState<TournamentMatch | null>(null);
  // Clave compuesta "teamId:playerId": un jugador podría figurar en la
  // plantilla de ambos equipos (nada lo impide hoy), así que indexar solo por
  // playerId mezclaría sus goles/tarjetas entre los dos lados del partido.
  const [statsDraft, setStatsDraft] = useState<Record<string, { goals: number; yellowCards: number; redCards: number }>>({});
  const [confirmSecondAuth, setConfirmSecondAuth] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  function statKey(teamId: number, playerId: number) {
    return `${teamId}:${playerId}`;
  }

  function openResultModal(match: TournamentMatch) {
    const draft: Record<string, { goals: number; yellowCards: number; redCards: number }> = {};
    for (const stat of match.stats) {
      draft[statKey(stat.teamId, stat.playerId)] = { goals: stat.goals, yellowCards: stat.yellowCards, redCards: stat.redCards };
    }
    setStatsDraft(draft);
    setConfirmSecondAuth(false);
    setResultModalMatch(match);
  }

  function closeResultModal() {
    setResultModalMatch(null);
    setStatsDraft({});
    setConfirmSecondAuth(false);
  }

  function statFor(teamId: number, playerId: number) {
    return statsDraft[statKey(teamId, playerId)] ?? { goals: 0, yellowCards: 0, redCards: 0 };
  }

  function updateStat(teamId: number, playerId: number, patch: Partial<{ goals: number; yellowCards: number; redCards: number }>) {
    setStatsDraft((current) => {
      const next = { ...statFor(teamId, playerId), ...patch };
      next.goals = Math.max(0, next.goals);
      return { ...current, [statKey(teamId, playerId)]: next };
    });
  }

  async function loadTournaments() {
    const response = await fetch("/api/tournaments");
    const payload = await readJson<ApiResponse<{ tournaments: TournamentCard[]; matches: TournamentMatch[]; standings: Standing[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar los torneos");
    }
    setData(payload);
  }

  async function loadTeams() {
    const response = await fetch("/api/teams");
    const payload = await readJson<ApiResponse<{ teams: TeamCard[]; users: UserOption[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar los equipos");
    }
    setTeams(payload.teams);
  }

  async function loadCourts() {
    const response = await fetch("/api/courts");
    const payload = await readJson<ApiResponse<{ courts: CourtCard[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar las canchas");
    }
    setCourts(payload.courts);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void Promise.all([loadTournaments(), loadTeams(), loadCourts()]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "No pudimos cargar los torneos");
    });
  }, []);

  function courtName(courtId: number) {
    return courts.find((court) => court.id === courtId)?.name ?? `Cancha #${courtId}`;
  }

  // Un dueño de cancha solo puede armar torneos en canchas de su propiedad;
  // un administrador de plataforma puede elegir cualquiera.
  const selectableCourts = useMemo(
    () => (isTenant(user) ? courts.filter((court) => court.tenantId === user.id) : courts),
    [courts, user],
  );

  async function createTournament() {
    setMessage("");
    if (!createForm.courtId) {
      setMessage("Selecciona la cancha donde se jugará el torneo");
      return;
    }
    if (createForm.teamIds.length < 2) {
      setMessage("Agrega al menos dos equipos participantes");
      return;
    }
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        ...createForm,
      }),
    });
    const payload = await readJson<ApiResponse<{ tournament?: TournamentCard }>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos crear el torneo");
      return;
    }
    setMessage("Torneo creado correctamente.");
    setCreateForm((current) => ({ ...current, name: "", courtId: null, teamIds: [] }));
    setManualPairs([]);
    setManualPairDraft({ homeTeamId: null, awayTeamId: null });
    await loadTournaments();
  }

  async function enrollTeam(teamId: number) {
    if (!selectedTournamentId) return;
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enroll", tournamentId: selectedTournamentId, teamId }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos inscribir el equipo");
      return;
    }
    setMessage("Equipo inscrito en el torneo.");
    await loadTournaments();
  }

  async function startTournament(tournamentId: number) {
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", tournamentId }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos iniciar el torneo");
      return;
    }
    setMessage("Calendario de partidos generado y notificaciones enviadas.");
    await loadTournaments();
  }

  function addManualPair() {
    if (!manualPairDraft.homeTeamId || !manualPairDraft.awayTeamId) return;
    if (manualPairDraft.homeTeamId === manualPairDraft.awayTeamId) {
      setMessage("Un equipo no puede jugar contra sí mismo");
      return;
    }
    setManualPairs((current) => [
      ...current,
      { homeTeamId: manualPairDraft.homeTeamId!, awayTeamId: manualPairDraft.awayTeamId! },
    ]);
    setManualPairDraft({ homeTeamId: null, awayTeamId: null });
  }

  function removeManualPair(index: number) {
    setManualPairs((current) => current.filter((_, pairIndex) => pairIndex !== index));
  }

  async function saveManualFixture(tournamentId: number) {
    if (manualPairs.length === 0) {
      setMessage("Agrega al menos un partido al fixture");
      return;
    }
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setManualFixture", tournamentId, pairs: manualPairs }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos guardar el fixture manual");
      return;
    }
    setMessage("Fixture manual guardado y torneo iniciado.");
    setManualPairs([]);
    setManualPairDraft({ homeTeamId: null, awayTeamId: null });
    await loadTournaments();
  }

  async function saveMatchResult() {
    if (!resultModalMatch) return;

    const stats = Object.entries(statsDraft).map(([key, stat]) => {
      const [teamIdText, playerIdText] = key.split(":");
      return {
        teamId: Number(teamIdText),
        playerId: Number(playerIdText),
        goals: stat.goals,
        yellowCards: stat.yellowCards,
        redCards: stat.redCards,
      };
    });

    setSavingResult(true);
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "result",
        matchId: resultModalMatch.id,
        stats,
        confirmedByAdmin: confirmSecondAuth,
      }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    setSavingResult(false);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos guardar el resultado");
      return;
    }
    setMessage("Resultado guardado y tabla actualizada.");
    closeResultModal();
    await loadTournaments();
  }

  const currentTournament = useMemo(
    () => data.tournaments.find((tournament) => tournament.id === selectedTournamentId) ?? data.tournaments[0] ?? null,
    [data.tournaments, selectedTournamentId]
  );

  function teamName(teamId: number) {
    return teams.find((team) => team.id === teamId)?.name ?? `Equipo #${teamId}`;
  }

  const resultModalHomeTeam = resultModalMatch ? teams.find((team) => team.id === resultModalMatch.homeTeamId) ?? null : null;
  const resultModalAwayTeam = resultModalMatch ? teams.find((team) => team.id === resultModalMatch.awayTeamId) ?? null : null;
  const resultModalHomePlayers = (resultModalHomeTeam?.players ?? []).filter(
    (player): player is { id: number; fullName: string; nickname?: string | null; email: string } => player !== null,
  );
  const resultModalAwayPlayers = (resultModalAwayTeam?.players ?? []).filter(
    (player): player is { id: number; fullName: string; nickname?: string | null; email: string } => player !== null,
  );
  const resultModalHomeGoals = resultModalMatch
    ? resultModalHomePlayers.reduce((sum, player) => sum + statFor(resultModalMatch.homeTeamId, player.id).goals, 0)
    : 0;
  const resultModalAwayGoals = resultModalMatch
    ? resultModalAwayPlayers.reduce((sum, player) => sum + statFor(resultModalMatch.awayTeamId, player.id).goals, 0)
    : 0;

  return (
    <div className="space-y-8">
      <PanelShell
        title="Gestión de torneos"
        description="Creá torneos, inscribí equipos, iniciá el calendario de partidos y actualizá la tabla de posiciones."
        action={<StatusPill>{data.tournaments.length} torneos</StatusPill>}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input className={fieldClassName} placeholder="Nombre del torneo" value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} />
          <div className="relative">
            <select className={fieldClassName} value={createForm.format} onChange={(event) => setCreateForm((current) => ({ ...current, format: event.target.value }))}>
              <option value="todos-contra-todos">Todos contra todos</option>
              <option value="eliminatorio">Eliminatorio</option>
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          <div className="relative">
            <select className={fieldClassName} value={createForm.fixtureMode} onChange={(event) => setCreateForm((current) => ({ ...current, fixtureMode: event.target.value === "manual" ? "manual" : "aleatorio" }))}>
              <option value="aleatorio">Fixture aleatorio</option>
              <option value="manual">Fixture manual</option>
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          <div className="relative">
            <select className={fieldClassName} value={createForm.courtId ?? ""} onChange={(event) => setCreateForm((current) => ({ ...current, courtId: event.target.value ? Number(event.target.value) : null }))}>
              <option value="">Selecciona la cancha</option>
              {selectableCourts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          <Button type="button" onClick={createTournament}>Crear torneo</Button>
        </div>
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            Equipos participantes ({createForm.teamIds.length} seleccionados)
          </p>
          <div className="flex flex-wrap gap-2">
            {teams.length > 0 ? teams.map((team) => {
              const isSelected = createForm.teamIds.includes(team.id);
              return (
                <Button
                  key={team.id}
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleCreateFormTeam(team.id)}
                >
                  {isSelected ? "✓ " : "+ "}{team.name}
                </Button>
              );
            }) : <p className="font-mono text-[11px] uppercase tracking-wider text-muted">No hay equipos creados todavía. Creá equipos en la pestaña Plantilla.</p>}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input type="date" className={fieldClassName} value={createForm.startDate} onChange={(event) => setCreateForm((current) => ({ ...current, startDate: event.target.value }))} />
          <input type="date" className={fieldClassName} value={createForm.endDate} onChange={(event) => setCreateForm((current) => ({ ...current, endDate: event.target.value }))} />
          <div className="relative xl:col-span-2">
            <select className={fieldClassName} value={selectedTournamentId ?? ""} onChange={(event) => setSelectedTournamentId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">Selecciona un torneo</option>
              {data.tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          {currentTournament?.fixtureMode === "manual" ? (
            <p className={`${fieldClassName} flex items-center justify-center text-center`}>
              Armá el fixture manual abajo ↓
            </p>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={!currentTournament}
              onClick={() => selectedTournamentId ? startTournament(selectedTournamentId) : null}
            >
              Iniciar torneo
            </Button>
          )}
        </div>

        {currentTournament && currentTournament.fixtureMode === "manual" && currentTournament.status === "draft" ? (
          <div className="mt-4 border-t border-black pt-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
              Fixture manual — {currentTournament.name}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <select
                  className={fieldClassName}
                  value={manualPairDraft.homeTeamId ?? ""}
                  onChange={(event) => setManualPairDraft((current) => ({ ...current, homeTeamId: event.target.value ? Number(event.target.value) : null }))}
                >
                  <option value="">Equipo local</option>
                  {currentTournament.teamIds.map((teamId) => <option key={teamId} value={teamId}>{teamName(teamId)}</option>)}
                </select>
                <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
              </div>
              <div className="relative">
                <select
                  className={fieldClassName}
                  value={manualPairDraft.awayTeamId ?? ""}
                  onChange={(event) => setManualPairDraft((current) => ({ ...current, awayTeamId: event.target.value ? Number(event.target.value) : null }))}
                >
                  <option value="">Equipo visitante</option>
                  {currentTournament.teamIds.map((teamId) => <option key={teamId} value={teamId}>{teamName(teamId)}</option>)}
                </select>
                <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
              </div>
              <Button type="button" variant="secondary" onClick={addManualPair}>
                Agregar partido
              </Button>
            </div>

            {manualPairs.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {manualPairs.map((pair, index) => (
                  <RowTag key={`${pair.homeTeamId}-${pair.awayTeamId}-${index}`} className="inline-flex items-center gap-1.5">
                    {teamName(pair.homeTeamId)} vs {teamName(pair.awayTeamId)}
                    <button type="button" onClick={() => removeManualPair(index)} aria-label="Quitar partido">
                      <X size={10} strokeWidth={2.5} aria-hidden />
                    </button>
                  </RowTag>
                ))}
              </div>
            ) : (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                Todavía no agregaste ningún partido.
              </p>
            )}

            <Button
              type="button"
              className="mt-3"
              disabled={manualPairs.length === 0}
              onClick={() => saveManualFixture(currentTournament.id)}
            >
              Guardar fixture y comenzar
            </Button>
          </div>
        ) : null}

        {message ? <div className="mt-4"><MessageBanner message={message} /></div> : null}
      </PanelShell>

      <div className="grid gap-4 xl:grid-cols-2">
        <section>
          <SectionLabel icon={Trophy} className="mb-3">Torneos existentes</SectionLabel>
          <div className="space-y-4">
            {data.tournaments.map((tournament) => (
              <Card key={tournament.id} className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-black leading-tight tracking-tight text-black">{tournament.name}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">{tournament.format} · {tournament.startDate} a {tournament.endDate}</p>
                    <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                      <MapPin size={12} strokeWidth={2} aria-hidden />
                      {courtName(tournament.courtId)}
                    </p>
                  </div>
                  <Badge>{tournament.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {teams.map((team) => (
                    <Button
                      key={team.id}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedTournamentId(tournament.id);
                        void enrollTeam(team.id);
                      }}
                    >
                      + {team.name}
                    </Button>
                  ))}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Equipos inscritos: {tournament.teamIds.length} / {tournament.teamsRequired}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel icon={CalendarDays} className="mb-3">Calendario de partidos y tabla</SectionLabel>
          <Card>
            {currentTournament ? (
              <div className="space-y-4">
                <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                  <MapPin size={12} strokeWidth={2} aria-hidden />
                  Sede del torneo: {courtName(currentTournament.courtId)}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Click en un partido para cargar goles y tarjetas por jugador
                </p>

                <div className="space-y-3">
                  {currentTournament.fixture.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => openResultModal(match)}
                      className="block w-full border border-black p-3 text-left transition-transform duration-150 ease-pop active:translate-x-px active:translate-y-px"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-black">Partido #{match.id}</p>
                        <Badge>{match.status}</Badge>
                      </div>
                      <p className="mt-1 font-sans text-sm text-black">{teamName(match.homeTeamId)} vs {teamName(match.awayTeamId)} · {formatDateTime(match.scheduledAt)}</p>
                      <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                        <MapPin size={12} strokeWidth={2} aria-hidden />
                        {courtName(currentTournament.courtId)}
                      </p>
                      <p className="mt-2 font-mono text-sm font-bold tabular-nums text-black">
                        Resultado: {match.homeGoals ?? "-"} / {match.awayGoals ?? "-"}
                      </p>
                      {match.auditTrail.length > 0 ? <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">{match.auditTrail[match.auditTrail.length - 1]}</p> : null}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto border border-black">
                  <table className="w-full min-w-max text-left text-sm">
                    <thead className="bg-black text-paper">
                      <tr>
                        <th className="sticky left-0 z-10 bg-black px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">Equipo</th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-wider">PJ</th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-wider">PTS</th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-wider">DG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTournament.standings.map((standing) => (
                        <tr key={`${standing.teamId}-${standing.tournamentId}`} className="border-t border-black">
                          <td className="sticky left-0 z-10 bg-paper px-3 py-2 font-sans text-sm text-black">{teamName(standing.teamId)}</td>
                          <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-black">{standing.played}</td>
                          <td className="px-3 py-2 text-right font-mono text-sm font-bold tabular-nums text-black">{standing.points}</td>
                          <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-black">{standing.goalsFor - standing.goalsAgainst}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Creá o seleccioná un torneo para ver el calendario de partidos.
              </p>
            )}
          </Card>
        </section>
      </div>

      <Modal
        open={resultModalMatch !== null}
        onClose={closeResultModal}
        title={resultModalMatch ? `${teamName(resultModalMatch.homeTeamId)} vs ${teamName(resultModalMatch.awayTeamId)}` : undefined}
        className="sm:max-w-2xl"
      >
        {resultModalMatch ? (
          <div className="space-y-4">
            <p className="text-center font-mono text-3xl font-black tabular-nums text-black">
              {resultModalHomeGoals} - {resultModalAwayGoals}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <SectionLabel icon={Users} className="mb-2">{resultModalHomeTeam?.name ?? "Local"}</SectionLabel>
                {resultModalHomePlayers.length > 0 ? (
                  <div>
                    {resultModalHomePlayers.map((player) => (
                      <PlayerStatRow
                        key={player.id}
                        name={displayName(player)}
                        stat={statFor(resultModalMatch.homeTeamId, player.id)}
                        onChange={(patch) => updateStat(resultModalMatch.homeTeamId, player.id, patch)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Sin jugadores en la plantilla</p>
                )}
              </div>
              <div>
                <SectionLabel icon={Users} className="mb-2">{resultModalAwayTeam?.name ?? "Visitante"}</SectionLabel>
                {resultModalAwayPlayers.length > 0 ? (
                  <div>
                    {resultModalAwayPlayers.map((player) => (
                      <PlayerStatRow
                        key={player.id}
                        name={displayName(player)}
                        stat={statFor(resultModalMatch.awayTeamId, player.id)}
                        onChange={(patch) => updateStat(resultModalMatch.awayTeamId, player.id, patch)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Sin jugadores en la plantilla</p>
                )}
              </div>
            </div>

            {resultModalMatch.resultLocked ? (
              <label className="flex items-center gap-2 border-t border-black pt-4">
                <RowCheckbox
                  checked={confirmSecondAuth}
                  onCheckedChange={setConfirmSecondAuth}
                  className="size-5"
                />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Segunda autorización para modificar resultado confirmado
                </span>
              </label>
            ) : null}

            <Button type="button" className="w-full" disabled={savingResult} onClick={saveMatchResult}>
              {savingResult ? "Guardando…" : "Guardar resultado"}
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function MyTournamentsPanel({ user }: { user: AppUser }) {
  const [tournaments, setTournaments] = useState<TournamentCard[]>([]);
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [courts, setCourts] = useState<CourtCard[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const [tournamentsResponse, teamsResponse, courtsResponse] = await Promise.all([
        fetch("/api/tournaments"),
        fetch("/api/teams"),
        fetch("/api/courts"),
      ]);
      const tournamentsPayload = await readJson<ApiResponse<{ tournaments: TournamentCard[] }>>(tournamentsResponse);
      const teamsPayload = await readJson<ApiResponse<{ teams: TeamCard[] }>>(teamsResponse);
      const courtsPayload = await readJson<ApiResponse<{ courts: CourtCard[] }>>(courtsResponse);
      if (!tournamentsResponse.ok) {
        throw new Error(tournamentsPayload.error || "No pudimos cargar los torneos");
      }
      if (!teamsResponse.ok) {
        throw new Error(teamsPayload.error || "No pudimos cargar los equipos");
      }
      if (!courtsResponse.ok) {
        throw new Error(courtsPayload.error || "No pudimos cargar las canchas");
      }
      setTournaments(tournamentsPayload.tournaments);
      setTeams(teamsPayload.teams);
      setCourts(courtsPayload.courts);
    }
    void load().catch((error) => setMessage(error instanceof Error ? error.message : "No pudimos cargar los torneos"));
  }, []);

  const myTeamIds = useMemo(
    () => teams.filter((team) => team.playerIds.includes(user.id)).map((team) => team.id),
    [teams, user.id]
  );

  const myTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.teamIds.some((teamId) => myTeamIds.includes(teamId))),
    [tournaments, myTeamIds]
  );

  function teamName(teamId: number) {
    return teams.find((team) => team.id === teamId)?.name ?? `Equipo #${teamId}`;
  }

  function courtName(courtId: number) {
    return courts.find((court) => court.id === courtId)?.name ?? `Cancha #${courtId}`;
  }

  return (
    <PanelShell
      title="Mis torneos"
      description="Torneos en los que participás junto con el calendario de partidos y la tabla de posiciones."
      action={<StatusPill>{myTournaments.length} torneos</StatusPill>}
    >
      {message ? <MessageBanner message={message} /> : null}
      {myTournaments.length > 0 ? (
        <div className="space-y-4">
          {myTournaments.map((tournament) => (
            <Card key={tournament.id} className="gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-black leading-tight tracking-tight text-black">{tournament.name}</h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">{tournament.format} · {tournament.startDate} a {tournament.endDate}</p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                    <MapPin size={12} strokeWidth={2} aria-hidden />
                    {courtName(tournament.courtId)}
                  </p>
                </div>
                <Badge>{tournament.status}</Badge>
              </div>

              <div className="space-y-2">
                {tournament.fixture.length > 0 ? (
                  tournament.fixture.map((match) => (
                    <div key={match.id} className="border border-black p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-black">{teamName(match.homeTeamId)} vs {teamName(match.awayTeamId)}</p>
                        <Badge>{match.status}</Badge>
                      </div>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                        {formatDateTime(match.scheduledAt)} · {courtName(tournament.courtId)}
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold tabular-nums text-black">
                        Resultado: {match.homeGoals ?? "-"} / {match.awayGoals ?? "-"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Aún no hay partidos programados.</p>
                )}
              </div>

              <div className="overflow-x-auto border border-black">
                <table className="w-full min-w-max text-left text-sm">
                  <thead className="bg-black text-paper">
                    <tr>
                      <th className="sticky left-0 z-10 bg-black px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">Equipo</th>
                      <th className="px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-wider">PJ</th>
                      <th className="px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-wider">PTS</th>
                      <th className="px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-wider">DG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.standings.map((standing) => (
                      <tr key={`${standing.teamId}-${standing.tournamentId}`} className="border-t border-black">
                        <td className="sticky left-0 z-10 bg-paper px-3 py-2 font-sans text-sm text-black">{teamName(standing.teamId)}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-black">{standing.played}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm font-bold tabular-nums text-black">{standing.points}</td>
                        <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-black">{standing.goalsFor - standing.goalsAgainst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Todavía no participás en ningún torneo.</p>
      )}
    </PanelShell>
  );
}

// Aviso opcional y descartable tras iniciar sesión para quien todavía no tiene
// apodo: no bloquea el uso de la app, solo invita a diferenciarse de otros
// jugadores con el mismo nombre. Se recuerda el "ahora no" por pestaña/sesión
// (sessionStorage), así que vuelve a aparecer en el próximo login si sigue sin apodo.
function NicknamePrompt({ user, onSaved }: { user: AppUser; onSaved: (nickname: string) => void }) {
  const dismissKey = `nickname-prompt-dismissed-${user.id}`;
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(dismissKey) === "1",
  );
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function dismiss() {
    sessionStorage.setItem(dismissKey, "1");
    setDismissed(true);
  }

  async function save() {
    if (!nickname.trim()) {
      dismiss();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, nickname: nickname.trim() }),
      });
      const payload = await readJson<ApiResponse<Record<string, never>>>(response);
      if (!response.ok) {
        setError(payload.error || "No pudimos guardar el apodo");
        return;
      }
      onSaved(nickname.trim());
      dismiss();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!user.nickname && !dismissed} onClose={dismiss} title="Agregá un apodo">
      <div className="space-y-3">
        <p className="font-sans text-sm text-black">
          Un apodo te ayuda a diferenciarte de otros jugadores con el mismo nombre en plantillas y torneos. Es opcional y lo podés cambiar cuando quieras desde tu perfil.
        </p>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Cómo te dicen en la cancha"
          maxLength={50}
          autoFocus
          className={fieldClassName}
        />
        {error ? <p className="font-mono text-[11px] uppercase tracking-wider text-red-700">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar apodo"}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={dismiss}>
            Ahora no
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ProfilePanel({ user }: { user: AppUser }) {
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
                    meta={`${court.address ?? "Sin dirección"}${court.pricePerHour ? ` · $${court.pricePerHour}/h` : ""}`}
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
            <p className="mt-3 font-sans text-sm text-black">Rol: {humanRole(profile.user.role)}</p>
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
          <Card nested>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Privacidad</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={profile.profile.visibility === "public" ? "default" : "secondary"} onClick={() => updateVisibility("public")}>Público</Button>
              <Button type="button" size="sm" variant={profile.profile.visibility === "private" ? "default" : "secondary"} onClick={() => updateVisibility("private")}>Privado</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => updateNotifications(!profile.user.notificationsEnabled)}>
                {profile.user.notificationsEnabled ? "Desactivar notificaciones" : "Activar notificaciones"}
              </Button>
            </div>
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

function TeamsPanel({ user }: { user: AppUser }) {
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [courts, setCourts] = useState<CourtCard[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const myTeams = useMemo(
    () => teams.filter((team) => team.playerIds.includes(user.id)),
    [teams, user.id]
  );

  const selectedTeam = useMemo(
    () => myTeams.find((team) => team.id === selectedTeamId) ?? null,
    [myTeams, selectedTeamId]
  );
  const isCaptainOfSelected = selectedTeam?.captainUserId === user.id;

  const filteredUsers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (candidate) =>
        candidate.fullName.toLowerCase().includes(query) ||
        (candidate.nickname?.toLowerCase().includes(query) ?? false) ||
        candidate.email.toLowerCase().includes(query)
    );
  }, [users, playerSearch]);

  function captainName(team: TeamCard) {
    const captain =
      team.players.find((player) => player?.id === team.captainUserId) ??
      users.find((candidate) => candidate.id === team.captainUserId);
    return captain ? displayName(captain) : `Jugador #${team.captainUserId}`;
  }

  async function loadTeams() {
    const response = await fetch("/api/teams");
    const payload = await readJson<ApiResponse<{ teams: TeamCard[]; users: UserOption[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar la plantilla");
    }
    setTeams(payload.teams);
    setUsers(payload.users);
    if (!selectedTeamId && payload.teams[0]) {
      setSelectedTeamId(payload.teams[0].id);
    }
    if (!selectedPlayerId && payload.users[0]) {
      setSelectedPlayerId(payload.users[0].id);
    }
  }

  async function loadCourts() {
    const response = await fetch(`/api/courts?userId=${user.id}`);
    const payload = await readJson<ApiResponse<{ courts: CourtCard[] }>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar tus reservas");
    }
    setCourts(payload.courts);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void Promise.all([loadTeams(), loadCourts()]).catch((error) =>
      setMessage(error instanceof Error ? error.message : "No pudimos cargar la plantilla"),
    );
  }, []);

  // Reservas propias del capitán (cualquier cancha), para convocar sin tener
  // que tipear fecha/hora/cancha a mano — se eligen entre lo que ya reservó.
  const myReservations = useMemo(
    () =>
      courts
        .flatMap((court) => court.reservations.map((reservation) => ({ ...reservation, courtName: court.name })))
        .filter((reservation) => reservation.userId === user.id && reservation.status !== "cancelada" && reservation.status !== "rechazada" && reservation.date >= todayIso())
        .sort((left, right) => (left.date === right.date ? left.timeSlot.localeCompare(right.timeSlot) : left.date.localeCompare(right.date))),
    [courts, user.id],
  );

  const selectedReservation = myReservations.find((reservation) => reservation.id === selectedReservationId) ?? null;

  async function createNewTeam() {
    if (!newTeamName.trim()) return;
    setMessage("");
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", tenantId: user.tenantId ?? 1, captainUserId: user.id, name: newTeamName }),
    });
    const payload = await readJson<ApiResponse<{ team?: TeamCard }>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos crear la plantilla");
      return;
    }
    setMessage("Plantilla creada. Ya eres el capitán.");
    setNewTeamName("");
    if (payload.team) {
      setSelectedTeamId(payload.team.id);
    }
    await loadTeams();
  }

  async function changeRoster(action: "add" | "remove") {
    if (!selectedTeamId || !selectedPlayerId) return;
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "roster", teamId: selectedTeamId, playerId: selectedPlayerId, rosterAction: action }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos actualizar la plantilla");
      return;
    }
    setMessage("Plantilla actualizada al instante.");
    await loadTeams();
  }

  async function sendConvocation() {
    if (!selectedTeamId || !selectedReservation) return;
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "convocation",
        teamId: selectedTeamId,
        userId: user.id,
        scheduledAt: `${selectedReservation.date} ${selectedReservation.timeSlot}`,
        courtName: selectedReservation.courtName,
      }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos enviar la convocatoria");
      return;
    }
    setMessage("Convocatoria enviada a toda la plantilla.");
  }

  return (
    <PanelShell title="Plantilla y convocatorias" description="Agregá o eliminá jugadores y notificá al equipo de forma inmediata.">
      {message ? <MessageBanner message={message} /> : null}
      <div className="mb-4 flex flex-wrap items-center gap-3 border border-black bg-paper p-4">
        <input
          value={newTeamName}
          onChange={(event) => setNewTeamName(event.target.value)}
          placeholder="Nombre de tu nueva plantilla"
          className={`${fieldClassName} min-w-50 flex-1`}
        />
        <Button type="button" onClick={createNewTeam}>Crear plantilla</Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <select className={fieldClassName} value={selectedTeamId ?? ""} onChange={(event) => setSelectedTeamId(event.target.value ? Number(event.target.value) : null)}>
                <option value="">Selecciona un equipo</option>
                {myTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
            </div>
            <input
              type="search"
              placeholder="Buscar jugador por nombre, apodo o correo…"
              value={playerSearch}
              onChange={(event) => setPlayerSearch(event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="relative">
            <select className={fieldClassName} value={selectedPlayerId ?? ""} onChange={(event) => setSelectedPlayerId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">Selecciona un jugador ({filteredUsers.length} resultados)</option>
              {filteredUsers.map((candidate) => <option key={candidate.id} value={candidate.id}>{displayName(candidate)} · {humanRole(candidate.role)}</option>)}
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => changeRoster("add")}>Agregar jugador</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => changeRoster("remove")}>Eliminar jugador</Button>
          </div>
        </Card>

        <Card className="gap-3">
          <div className="relative">
            <select
              className={fieldClassName}
              value={selectedReservationId ?? ""}
              onChange={(event) => setSelectedReservationId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Selecciona una de tus reservas</option>
              {myReservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.courtName} · {reservation.date} · {reservation.timeSlot}
                </option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          {myReservations.length === 0 ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              No tenés reservas próximas. Reservá una cancha para poder convocar a la plantilla.
            </p>
          ) : null}
          <Button
            type="button"
            onClick={sendConvocation}
            disabled={!selectedTeam || !isCaptainOfSelected || !selectedReservation}
            title={selectedTeam && !isCaptainOfSelected ? "Solo el capitán del equipo puede enviar convocatorias" : undefined}
          >
            Enviar convocatoria
          </Button>
          {selectedTeam && !isCaptainOfSelected ? (
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Solo el capitán ({captainName(selectedTeam)}) puede enviar convocatorias para este equipo.
            </p>
          ) : null}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {myTeams.length > 0 ? myTeams.map((team) => (
          <Card key={team.id} className="gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-black leading-tight tracking-tight text-black">{team.name}</h3>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Capitán: {captainName(team)}</p>
              </div>
              <Badge>{team.playerIds.length} jugadores</Badge>
            </div>
            <ul>
              {team.players.map((player) => (
                <Row
                  key={player?.id ?? `${team.id}-empty`}
                  title={player ? displayName(player) : "Vacante"}
                  disabled={!player}
                />
              ))}
            </ul>
          </Card>
        )) : <p className="font-mono text-[11px] uppercase tracking-wider text-muted">No pertenecés a ninguna plantilla todavía.</p>}
      </div>
    </PanelShell>
  );
}

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
    default:
      return type;
  }
}

function NotificationsPanel({ user }: { user: AppUser }) {
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

function isTenant(user: AppUser) {
  return user.role === "tenant";
}

function TenantPaymentsPanel({ user }: { user: AppUser }) {
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
              title={reservation.courtName}
              meta={`${reservation.date} · ${reservation.timeSlot}${
                reservation.paymentMethod ? ` · ${paymentMethodLabels[reservation.paymentMethod]}` : ""
              }${reservation.amount ? ` · ₡${reservation.amount}` : ""}`}
              right={
                <div className="flex items-center gap-2">
                  <Button size="sm" disabled={busy} onClick={() => respond(reservation.id, "confirm")}>
                    Confirmar pago
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
    </PanelShell>
  );
}

export function DashboardScreen({ user, onLogout, onUserUpdate }: DashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabButtons)[number]["id"]>("reservas");

  return (
    <div className="min-h-screen bg-paper px-4 py-6 font-sans sm:px-6 lg:px-8">
      <NicknamePrompt user={user} onSaved={(nickname) => onUserUpdate({ ...user, nickname })} />
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
            {tabButtons.map((tab) => {
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
        {activeTab === "perfil" ? <ProfilePanel user={user} /> : null}
        {activeTab === "plantilla" ? <TeamsPanel user={user} /> : null}
        {activeTab === "notificaciones" ? <NotificationsPanel user={user} /> : null}
      </div>
    </div>
  );
}
