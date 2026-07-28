"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Clock3,
  LogOut,
  ShieldCheck,
  Users,
  Trophy,
  Settings2,
  MapPin,
} from "lucide-react";

export type AppUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  // Los jugadores y administradores de plataforma no pertenecen a un tenant fijo;
  // solo los usuarios con rol "tenant" tienen id_user propio como identificador de cancha.
  tenantId?: number | null;
  notificationsEnabled: boolean;
};

type CourtReservation = {
  id: number;
  userId: number;
  courtId: number;
  date: string;
  timeSlot: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

type CourtCard = {
  id: number;
  name: string;
  location: string;
  surface: "synthetic" | "natural" | "indoor";
  capacity: string;
  pricePerHour: number;
  rating: number;
  availableSlots: string[];
  reservations: CourtReservation[];
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
  name: string;
  format: string;
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
  players: Array<{ id: number; fullName: string; email: string } | null>;
};

type UserOption = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

type ProfileSnapshot = {
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

type DashboardScreenProps = {
  user: AppUser;
  onLogout: () => void;
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

function nextHourDateTimeLocal() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
      return "Administrador";
    case "recepcionista":
      return "Recepcionista";
    case "organizador":
      return "Organizador";
    default:
      return "Jugador";
  }
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
      <BadgeCheck size={12} />
      {children}
    </span>
  );
}

function PanelShell({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
      {children}
    </span>
  );
}

function BookingPanel({ user }: { user: AppUser }) {
  const [date, setDate] = useState(todayIso());
  const [timeSlot, setTimeSlot] = useState("all");
  const [surface, setSurface] = useState("all");
  const [courtSearch, setCourtSearch] = useState("");
  const [courts, setCourts] = useState<CourtCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function loadCourts() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/courts?userId=${user.id}&date=${date}&timeSlot=${timeSlot}&surface=${surface}`
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

  async function reserve(courtId: number, slot: string) {
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
        body: JSON.stringify({ userId: user.id, courtId, date, timeSlot: slot }),
      });
      const payload = await readJson<ApiResponse<{ reservation?: CourtReservation; suggestedSlot?: string | null }>>(response);
      if (!response.ok) {
        throw new Error(
          payload.suggestedSlot
            ? `${payload.error || "Franja no disponible"}. Próxima franja libre: ${payload.suggestedSlot}`
            : payload.error || "No pudimos reservar"
        );
      }

      setMessage("Reserva confirmada y notificación generada.");
      await loadCourts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos reservar");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(reservationId: number) {
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
    const query = courtSearch.trim().toLowerCase();
    if (!query) return courts;
    return courts.filter(
      (court) =>
        court.name.toLowerCase().includes(query) ||
        court.location.toLowerCase().includes(query)
    );
  }, [courts, courtSearch]);

  return (
    <div className="space-y-5">
      <PanelShell
        title="Disponibilidad en tiempo real"
        description="Filtra canchas, reserva una franja y cancela una reserva con la política de 24 horas."
        action={
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <Badge>{busy ? "Actualizando" : "Sincronizado"}</Badge>
            <Badge>{user.notificationsEnabled ? "Notificaciones activas" : "Notificaciones desactivadas"}</Badge>
          </div>
        }
      >
        <label className="mb-3 block space-y-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <MapPin size={13} />
            Buscar cancha
          </span>
          <input
            type="search"
            placeholder="Nombre o ubicación..."
            value={courtSearch}
            onChange={(event) => setCourtSearch(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <CalendarDays size={13} />
              Fecha
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
            />
          </label>
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <Clock3 size={13} />
              Franja
            </span>
            <select
              value={timeSlot}
              onChange={(event) => setTimeSlot(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
            >
              <option value="all">Todo el día</option>
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
              <option value="night">Noche</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <ShieldCheck size={13} />
              Superficie
            </span>
            <select
              value={surface}
              onChange={(event) => setSurface(event.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
            >
              <option value="all">Todas</option>
              <option value="synthetic">Sintética</option>
              <option value="natural">Natural</option>
              <option value="indoor">Indoor</option>
            </select>
          </label>
        </div>
        {message ? <p className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
      </PanelShell>

      <div className="grid gap-4 xl:grid-cols-3">
        {filteredCourts.length > 0 ? filteredCourts.map((court) => (
          <article key={court.id} className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{court.name}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={12} />
                  {court.location}
                </p>
              </div>
              <StatusPill>{court.rating.toFixed(1)}</StatusPill>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <Badge>{surfaceLabel(court.surface)}</Badge>
              <Badge>{court.capacity}</Badge>
              <Badge>${court.pricePerHour}/h</Badge>
              <Badge>{court.availableSlots.length} horarios</Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {court.availableSlots.length > 0 ? court.availableSlots.map((slot) => (
                <button
                  key={`${court.id}-${slot}`}
                  type="button"
                  disabled={busy}
                  onClick={() => reserve(court.id, slot)}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-60"
                >
                  Reservar {slot}
                </button>
              )) : <p className="text-xs text-slate-500">Sin horarios libres</p>}
            </div>
          </article>
        )) : <p className="text-sm text-slate-400">No encontramos canchas que coincidan con la búsqueda.</p>}
      </div>

      <PanelShell title="Mis reservas" description="Las cancelaciones requieren más de 24 horas de anticipación.">
        <div className="space-y-3">
          {myReservations.length > 0 ? myReservations.map((reservation) => (
            <div key={reservation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3">
              <div>
                <p className="font-semibold text-slate-100">{reservation.courtName}</p>
                <p className="text-sm text-slate-400">{reservation.date} · {reservation.timeSlot}</p>
              </div>
              <button
                type="button"
                disabled={busy || reservation.status === "cancelled"}
                onClick={() => cancel(reservation.id)}
                className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          )) : <p className="text-sm text-slate-400">No tienes reservas activas todavía.</p>}
        </div>
      </PanelShell>
    </div>
  );
}

function TournamentsPanel({ user }: { user: AppUser }) {
  const [data, setData] = useState<{ tournaments: TournamentCard[]; matches: TournamentMatch[]; standings: Standing[] }>({ tournaments: [], matches: [], standings: [] });
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [message, setMessage] = useState("");
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    format: "todos-contra-todos",
    teamsRequired: 3,
    startDate: todayIso(),
    endDate: todayIso(),
  });
  const [resultForm, setResultForm] = useState({ matchId: "", homeGoals: "", awayGoals: "", confirmSecondAuth: false });

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void Promise.all([loadTournaments(), loadTeams()]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "No pudimos cargar los torneos");
    });
  }, []);

  async function createTournament() {
    setMessage("");
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        tenantId: user.tenantId,
        userId: user.id,
        ...createForm,
        teamsRequired: Number(createForm.teamsRequired),
        format: createForm.format,
      }),
    });
    const payload = await readJson<ApiResponse<{ tournament?: TournamentCard }>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos solicitar el torneo");
      return;
    }
    setMessage("Solicitud enviada. Queda pendiente de aprobación del dueño de la cancha.");
    await loadTournaments();
  }

  async function reviewTournament(tournamentId: number, decision: "aprobado" | "rechazado") {
    setMessage("");
    const reason = decision === "rechazado" ? window.prompt("Motivo del rechazo (opcional):") ?? undefined : undefined;
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review", tournamentId, reviewerUserId: user.id, decision, reason }),
    });
    const payload = await readJson<ApiResponse<{ tournament?: TournamentCard }>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos revisar la solicitud");
      return;
    }
    setMessage(decision === "aprobado" ? "Torneo aprobado." : "Torneo rechazado.");
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

  async function confirmResult() {
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "result",
        matchId: Number(resultForm.matchId),
        homeGoals: Number(resultForm.homeGoals),
        awayGoals: Number(resultForm.awayGoals),
        confirmedByAdmin: resultForm.confirmSecondAuth,
      }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos guardar el resultado");
      return;
    }
    setMessage("Resultado guardado y tabla actualizada.");
    await loadTournaments();
  }

  const currentTournament = useMemo(
    () => data.tournaments.find((tournament) => tournament.id === selectedTournamentId) ?? data.tournaments[0] ?? null,
    [data.tournaments, selectedTournamentId]
  );

  function teamName(teamId: number) {
    return teams.find((team) => team.id === teamId)?.name ?? `Equipo #${teamId}`;
  }

  return (
    <div className="space-y-5">
      <PanelShell
        title="Gestión de torneos"
        description="Solicita torneos, inscribe equipos, inicia el calendario de partidos y actualiza la tabla de posiciones."
        action={<StatusPill>{data.tournaments.length} torneos</StatusPill>}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400 xl:col-span-2" placeholder="Nombre del torneo" value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} />
          <select className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" value={createForm.format} onChange={(event) => setCreateForm((current) => ({ ...current, format: event.target.value }))}>
            <option value="todos-contra-todos">Todos contra todos</option>
            <option value="eliminatorio">Eliminatorio</option>
          </select>
          <input type="number" min={2} className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" value={createForm.teamsRequired} onChange={(event) => setCreateForm((current) => ({ ...current, teamsRequired: Number(event.target.value) }))} />
          <button type="button" onClick={createTournament} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:brightness-110" title="Queda pendiente de aprobación del dueño de la cancha">Solicitar torneo</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input type="date" className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" value={createForm.startDate} onChange={(event) => setCreateForm((current) => ({ ...current, startDate: event.target.value }))} />
          <input type="date" className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" value={createForm.endDate} onChange={(event) => setCreateForm((current) => ({ ...current, endDate: event.target.value }))} />
          <select className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400 xl:col-span-2" value={selectedTournamentId ?? ""} onChange={(event) => setSelectedTournamentId(event.target.value ? Number(event.target.value) : null)}>
            <option value="">Selecciona un torneo</option>
            {data.tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}
          </select>
          <button
            type="button"
            disabled={!currentTournament || currentTournament.requestStatus !== "aprobado"}
            onClick={() => selectedTournamentId ? startTournament(selectedTournamentId) : null}
            className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-40"
            title={currentTournament && currentTournament.requestStatus !== "aprobado" ? "El torneo debe ser aprobado por el dueño de la cancha antes de iniciarse" : undefined}
          >
            Iniciar torneo
          </button>
        </div>
        {message ? <p className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
      </PanelShell>

      <div className="grid gap-4 xl:grid-cols-2">
        <PanelShell title="Torneos existentes" description="Inscribe equipos y revisa el calendario de partidos generado.">
          <div className="space-y-4">
            {data.tournaments.map((tournament) => (
              <article key={tournament.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{tournament.name}</h3>
                    <p className="text-sm text-slate-400">{tournament.format} · {tournament.startDate} a {tournament.endDate}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{tournament.status}</Badge>
                    <Badge>{tournament.requestStatus}</Badge>
                  </div>
                </div>
                {tournament.requestStatus === "pendiente" && user.role === "administrador" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => reviewTournament(tournament.id, "aprobado")} className="rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:brightness-110">Aprobar</button>
                    <button type="button" onClick={() => reviewTournament(tournament.id, "rechazado")} className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-400/20">Rechazar</button>
                  </div>
                ) : null}
                {tournament.requestStatus === "pendiente" && user.role !== "administrador" ? (
                  <p className="mt-3 text-xs text-amber-300">Pendiente de aprobación del dueño de la cancha.</p>
                ) : null}
                {tournament.requestStatus === "rechazado" ? (
                  <p className="mt-3 text-xs text-red-300">Solicitud rechazada: {tournament.rejectionReason}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      disabled={tournament.requestStatus !== "aprobado"}
                      onClick={() => {
                        setSelectedTournamentId(tournament.id);
                        void enrollTeam(team.id);
                      }}
                      className="rounded-full border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      + {team.name}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Equipos inscritos: {tournament.teamIds.length} / {tournament.teamsRequired}</p>
              </article>
            ))}
          </div>
        </PanelShell>

        <PanelShell title="Calendario de partidos y tabla" description="Resultados inmediatos con actualización de posiciones y auditoría.">
          {currentTournament ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" placeholder="ID partido" value={resultForm.matchId} onChange={(event) => setResultForm((current) => ({ ...current, matchId: event.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" placeholder="Local" value={resultForm.homeGoals} onChange={(event) => setResultForm((current) => ({ ...current, homeGoals: event.target.value }))} />
                  <input type="number" className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" placeholder="Visita" value={resultForm.awayGoals} onChange={(event) => setResultForm((current) => ({ ...current, awayGoals: event.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={resultForm.confirmSecondAuth} onChange={(event) => setResultForm((current) => ({ ...current, confirmSecondAuth: event.target.checked }))} />
                Segunda autorización para modificar resultado confirmado
              </label>
              <button type="button" onClick={confirmResult} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:brightness-110">Guardar resultado</button>

              <div className="space-y-3">
                {currentTournament.fixture.map((match) => (
                  <div key={match.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-100">Partido #{match.id}</p>
                      <Badge>{match.status}</Badge>
                    </div>
                    <p className="mt-1">{teamName(match.homeTeamId)} vs {teamName(match.awayTeamId)} · {formatDateTime(match.scheduledAt)}</p>
                    <p className="mt-2">Resultado: {match.homeGoals ?? "-"} / {match.awayGoals ?? "-"}</p>
                    {match.auditTrail.length > 0 ? <p className="mt-2 text-xs text-slate-500">{match.auditTrail[match.auditTrail.length - 1]}</p> : null}
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.18em] text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Equipo</th>
                      <th className="px-3 py-2">PJ</th>
                      <th className="px-3 py-2">PTS</th>
                      <th className="px-3 py-2">DG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTournament.standings.map((standing) => (
                      <tr key={`${standing.teamId}-${standing.tournamentId}`} className="border-t border-white/5 bg-slate-950/70">
                        <td className="px-3 py-2">{teamName(standing.teamId)}</td>
                        <td className="px-3 py-2">{standing.played}</td>
                        <td className="px-3 py-2">{standing.points}</td>
                        <td className="px-3 py-2">{standing.goalsFor - standing.goalsAgainst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Crea o selecciona un torneo para ver el calendario de partidos.</p>
          )}
        </PanelShell>
      </div>
    </div>
  );
}

function ProfilePanel({ user }: { user: AppUser }) {
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);
  const [message, setMessage] = useState("");

  async function loadProfile() {
    const response = await fetch(`/api/profile?userId=${user.id}`);
    const payload = await readJson<ApiResponse<ProfileSnapshot>>(response);
    if (!response.ok) {
      throw new Error(payload.error || "No pudimos cargar el perfil");
    }
    setProfile(payload);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile().catch((error) => setMessage(error instanceof Error ? error.message : "No pudimos cargar el perfil"));
  }, []);

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

  return (
    <PanelShell title="Perfil global" description="Estadísticas acumuladas, torneos disputados y privacidad."
      action={<StatusPill>{profile?.profile.visibility ?? "public"}</StatusPill>}
    >
      {message ? <p className="mb-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
      {profile ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Jugador</p>
            <h3 className="mt-2 text-xl font-bold text-slate-100">{profile.user.fullName}</h3>
            <p className="text-sm text-slate-400">{profile.user.email}</p>
            <p className="mt-3 text-sm text-slate-300">Rol: {humanRole(profile.user.role)}</p>
            <p className="text-sm text-slate-300">Notificaciones: {profile.user.notificationsEnabled ? "activas" : "desactivadas"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Estadísticas</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div><p className="text-2xl font-bold text-slate-100">{profile.profile.goals}</p><p className="text-xs text-slate-400">Goles</p></div>
              <div><p className="text-2xl font-bold text-slate-100">{profile.profile.assists}</p><p className="text-xs text-slate-400">Asistencias</p></div>
              <div><p className="text-2xl font-bold text-slate-100">{profile.profile.matchesPlayed}</p><p className="text-xs text-slate-400">Partidos</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Privacidad</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => updateVisibility("public")} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950">Público</button>
              <button type="button" onClick={() => updateVisibility("private")} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200">Privado</button>
              <button type="button" onClick={() => updateNotifications(!profile.user.notificationsEnabled)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200">{profile.user.notificationsEnabled ? "Desactivar notificaciones" : "Activar notificaciones"}</button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 xl:col-span-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Torneos y canchas vinculadas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.tournaments.map((tournament) => <Badge key={tournament}>{tournament}</Badge>)}
              {profile.courts.map((court) => <Badge key={court}>{court}</Badge>)}
            </div>
          </div>
        </div>
      ) : <p className="text-sm text-slate-400">Cargando perfil...</p>}
    </PanelShell>
  );
}

function TeamsPanel({ user }: { user: AppUser }) {
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [scheduledAt, setScheduledAt] = useState(nextHourDateTimeLocal());
  const [courtName, setCourtName] = useState("Complejo Norte - Cancha A");
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
        candidate.email.toLowerCase().includes(query)
    );
  }, [users, playerSearch]);

  function captainName(team: TeamCard) {
    return (
      team.players.find((player) => player?.id === team.captainUserId)?.fullName ??
      users.find((candidate) => candidate.id === team.captainUserId)?.fullName ??
      `Jugador #${team.captainUserId}`
    );
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTeams().catch((error) => setMessage(error instanceof Error ? error.message : "No pudimos cargar la plantilla"));
  }, []);

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
    if (!selectedTeamId) return;
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "convocation", teamId: selectedTeamId, userId: user.id, scheduledAt, courtName }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos enviar la convocatoria");
      return;
    }
    setMessage("Convocatoria enviada a toda la plantilla.");
  }

  return (
    <PanelShell title="Plantilla y convocatorias" description="Agrega o elimina jugadores y notifica al equipo de forma inmediata.">
      {message ? <p className="mb-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
        <input
          value={newTeamName}
          onChange={(event) => setNewTeamName(event.target.value)}
          placeholder="Nombre de tu nueva plantilla"
          className="h-11 flex-1 min-w-50 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
        />
        <button type="button" onClick={createNewTeam} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:brightness-110">Crear plantilla</button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <select className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" value={selectedTeamId ?? ""} onChange={(event) => setSelectedTeamId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">Selecciona un equipo</option>
              {myTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <input
              type="search"
              placeholder="Buscar jugador por nombre o correo..."
              value={playerSearch}
              onChange={(event) => setPlayerSearch(event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
            />
          </div>
          <select className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" value={selectedPlayerId ?? ""} onChange={(event) => setSelectedPlayerId(event.target.value ? Number(event.target.value) : null)}>
            <option value="">Selecciona un jugador ({filteredUsers.length} resultados)</option>
            {filteredUsers.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.fullName} · {humanRole(candidate.role)}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => changeRoster("add")} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950">Agregar jugador</button>
            <button type="button" onClick={() => changeRoster("remove")} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200">Eliminar jugador</button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" />
            <input value={courtName} onChange={(event) => setCourtName(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" placeholder="Cancha" />
          </div>
          <button
            type="button"
            onClick={sendConvocation}
            disabled={!selectedTeam || !isCaptainOfSelected}
            title={selectedTeam && !isCaptainOfSelected ? "Solo el capitán del equipo puede enviar convocatorias" : undefined}
            className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enviar convocatoria
          </button>
          {selectedTeam && !isCaptainOfSelected ? (
            <p className="text-xs text-amber-300">Solo el capitán ({captainName(selectedTeam)}) puede enviar convocatorias para este equipo.</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {myTeams.length > 0 ? myTeams.map((team) => (
          <article key={team.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{team.name}</h3>
                <p className="text-sm text-slate-400">Capitán: {captainName(team)}</p>
              </div>
              <Badge>{team.playerIds.length} jugadores</Badge>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {team.players.map((player) => (
                <li key={player?.id ?? `${team.id}-empty`} className="rounded-lg bg-slate-950/80 px-3 py-2">
                  {player ? player.fullName : "Vacante"}
                </li>
              ))}
            </ul>
          </article>
        )) : <p className="text-sm text-slate-400">No perteneces a ninguna plantilla todavía.</p>}
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
      {message ? <p className="mb-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">{message}</p> : null}
      {!user.notificationsEnabled ? (
        <p className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Tienes las notificaciones desactivadas desde tu perfil. Actívalas para recibir nuevos avisos.
        </p>
      ) : null}
      <div className="space-y-3">
        {notifications.length > 0 ? notifications.map((notification) => (
          <div key={notification.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">{notification.message}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDateTime(notification.createdAt)}</p>
            </div>
            <Badge>{notificationTypeLabel(notification.type)}</Badge>
          </div>
        )) : <p className="text-sm text-slate-400">No tienes notificaciones todavía.</p>}
      </div>
    </PanelShell>
  );
}

export function DashboardScreen({ user, onLogout }: DashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabButtons)[number]["id"]>("reservas");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_28%),linear-gradient(180deg,#08111f_0%,#050914_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <StatusPill>Sesión activa</StatusPill>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-50">Hola, {user.fullName}</h1>
            <p className="mt-2 text-sm text-slate-400">
              {humanRole(user.role)} · {user.email}
              {user.tenantId ? ` · tenant #${user.tenantId}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tabButtons.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${isActive ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20 hover:text-slate-100"}`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-slate-100"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </header>

        {activeTab === "reservas" ? <BookingPanel user={user} /> : null}
        {activeTab === "torneos" ? <TournamentsPanel user={user} /> : null}
        {activeTab === "perfil" ? <ProfilePanel user={user} /> : null}
        {activeTab === "plantilla" ? <TeamsPanel user={user} /> : null}
        {activeTab === "notificaciones" ? <NotificationsPanel user={user} /> : null}
      </div>
    </div>
  );
}
