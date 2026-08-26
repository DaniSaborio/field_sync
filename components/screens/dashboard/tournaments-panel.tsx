"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, MapPin, Minus, Plus, Trophy, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { RowCheckbox, RowTag } from "@/components/ui/row";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import { fieldClassName } from "./constants";
import { Badge, MessageBanner, PanelShell, StatusPill } from "./shared-ui";
import type { ApiResponse, AppUser, CourtCard, Standing, TeamCard, TournamentCard, TournamentMatch, UserOption } from "./types";
import { displayName, formatDateTime, isAdmin, isTenant, readJson, todayIso, tournamentStatusLabel } from "./utils";

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

export function TournamentsPanel({ user }: { user: AppUser }) {
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
  const [teamSearch, setTeamSearch] = useState("");
  const [enrollSearchByTournament, setEnrollSearchByTournament] = useState<Record<number, string>>({});
  const fixtureSectionRef = useRef<HTMLDivElement>(null);

  function viewMatches(tournamentId: number) {
    setSelectedTournamentId(tournamentId);
    fixtureSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filteredTeamsForCreate = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [teams, teamSearch]);

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

  async function respondToRequest(tournamentId: number, decision: "approve" | "reject") {
    let reason: string | null = null;
    if (decision === "reject") {
      reason = window.prompt("Motivo del rechazo de la solicitud:");
      if (!reason || !reason.trim()) return;
    }

    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "respond", tournamentId, userId: user.id, role: user.role, decision, reason }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos procesar la solicitud");
      return;
    }
    setMessage(decision === "approve" ? "Solicitud aprobada." : "Solicitud rechazada.");
    await loadTournaments();
  }

  async function closeTournament(tournamentId: number) {
    if (!window.confirm("¿Cerrar este torneo? Ya no se podrán inscribir equipos ni tocar su calendario.")) return;

    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", tournamentId, userId: user.id, role: user.role }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos cerrar el torneo");
      return;
    }
    setMessage("Torneo cerrado.");
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
      setMessage("Agrega al menos un partido al calendario");
      return;
    }
    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setManualFixture", tournamentId, pairs: manualPairs }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos guardar el calendario manual");
      return;
    }
    setMessage("Calendario manual guardado y torneo iniciado.");
    setManualPairs([]);
    setManualPairDraft({ homeTeamId: null, awayTeamId: null });
    await loadTournaments();
  }

  async function saveMatchResult() {
    if (!resultModalMatch) return;

    if (!navigator.onLine) {
      setMessage("No es posible ingresar el resultado sin conexión.");
      return;
    }

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
              <option value="aleatorio">Calendario aleatorio</option>
              <option value="manual">Calendario manual</option>
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
          {teams.length > 0 ? (
            <input
              type="search"
              placeholder="Buscar equipo por nombre…"
              value={teamSearch}
              onChange={(event) => setTeamSearch(event.target.value)}
              className={`${fieldClassName} mb-2`}
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            {teams.length === 0 ? (
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">No hay equipos creados todavía. Creá equipos en la pestaña Plantilla.</p>
            ) : filteredTeamsForCreate.length > 0 ? (
              filteredTeamsForCreate.map((team) => {
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
              })
            ) : (
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Sin resultados para esa búsqueda.</p>
            )}
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
              Armá el calendario manual abajo ↓
            </p>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={!currentTournament || currentTournament.status === "closed" || currentTournament.requestStatus !== "aprobado"}
              title={
                currentTournament?.status === "closed"
                  ? "Este torneo está cerrado"
                  : currentTournament && currentTournament.requestStatus !== "aprobado"
                    ? "Este torneo todavía no fue aprobado"
                    : undefined
              }
              onClick={() => selectedTournamentId ? startTournament(selectedTournamentId) : null}
            >
              Iniciar torneo
            </Button>
          )}
        </div>

        {currentTournament && currentTournament.fixtureMode === "manual" && currentTournament.status === "draft" ? (
          <div className="mt-4 border-t border-black pt-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
              Calendario manual — {currentTournament.name}
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
              Guardar calendario y comenzar
            </Button>
          </div>
        ) : null}

        {message ? <div className="mt-4"><MessageBanner message={message} /></div> : null}
      </PanelShell>

      <div className="grid gap-4 xl:grid-cols-2">
        <section>
          <SectionLabel icon={Trophy} className="mb-3">Torneos existentes</SectionLabel>
          <div className="space-y-4">
            {data.tournaments.map((tournament) => {
              const isOwnerOfCourt = courts.find((court) => court.id === tournament.courtId)?.tenantId === user.id;
              const canManage = isAdmin(user) || isOwnerOfCourt;
              const canRespond = tournament.requestStatus === "pendiente" && canManage;

              const isSelected = tournament.id === currentTournament?.id;

              return (
                <Card
                  key={tournament.id}
                  className={cn("gap-3", isSelected && "border-l-4 border-neon pl-3")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-black leading-tight tracking-tight text-black">{tournament.name}</h3>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">{tournament.format} · {tournament.startDate} a {tournament.endDate}</p>
                      <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                        <MapPin size={12} strokeWidth={2} aria-hidden />
                        {courtName(tournament.courtId)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge>{tournamentStatusLabel(tournament.status)}</Badge>
                      <RowTag tone={tournament.requestStatus === "aprobado" ? "positive" : tournament.requestStatus === "rechazado" ? "negative" : "default"}>
                        {tournament.requestStatus === "pendiente" ? "Solicitud pendiente" : tournament.requestStatus === "aprobado" ? "Aprobado" : "Rechazado"}
                      </RowTag>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => viewMatches(tournament.id)}>
                      <CalendarDays size={14} strokeWidth={2} aria-hidden />
                      Ver partidos ({tournament.fixture.length})
                    </Button>
                    {canManage && tournament.status !== "closed" ? (
                      <Button type="button" variant="destructive" size="sm" onClick={() => closeTournament(tournament.id)}>
                        Cerrar torneo
                      </Button>
                    ) : null}
                  </div>

                  {tournament.requestStatus === "rechazado" && tournament.rejectionReason ? (
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Motivo: {tournament.rejectionReason}</p>
                  ) : null}

                  {tournament.teamIds.length > 0 ? (
                    <div>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">Equipos inscritos:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tournament.teamIds.map((teamId) => (
                          <RowTag key={teamId} tone="positive">{teamName(teamId)}</RowTag>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {canRespond ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={() => respondToRequest(tournament.id, "approve")}>
                        Aprobar solicitud
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => respondToRequest(tournament.id, "reject")}>
                        Rechazar solicitud
                      </Button>
                    </div>
                  ) : (
                    (() => {
                      const availableTeams = teams.filter((team) => !tournament.teamIds.includes(team.id));
                      const alreadyClosed = tournament.status === "closed";
                      const alreadyStarted = tournament.status === "active";
                      const disabledReason = alreadyClosed
                        ? "El torneo está cerrado: no se pueden agregar más equipos"
                        : alreadyStarted
                          ? "El torneo ya comenzó: no se pueden agregar más equipos"
                          : tournament.requestStatus !== "aprobado"
                            ? "Este torneo todavía no fue aprobado"
                            : undefined;
                      const enrollSearch = enrollSearchByTournament[tournament.id] ?? "";
                      const filteredAvailableTeams = enrollSearch.trim()
                        ? availableTeams.filter((team) => team.name.toLowerCase().includes(enrollSearch.trim().toLowerCase()))
                        : availableTeams;
                      return availableTeams.length > 0 ? (
                        <div>
                          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">Agregar equipo:</p>
                          {disabledReason ? (
                            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted">{disabledReason}</p>
                          ) : null}
                          {availableTeams.length > 5 ? (
                            <input
                              type="search"
                              placeholder="Buscar equipo por nombre…"
                              value={enrollSearch}
                              onChange={(event) =>
                                setEnrollSearchByTournament((current) => ({ ...current, [tournament.id]: event.target.value }))
                              }
                              className={`${fieldClassName} mb-1.5 h-9`}
                            />
                          ) : null}
                          <div className="flex flex-wrap gap-1.5">
                            {filteredAvailableTeams.length > 0 ? (
                              filteredAvailableTeams.map((team) => (
                                <Button
                                  key={team.id}
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={disabledReason !== undefined}
                                  title={disabledReason}
                                  onClick={() => {
                                    setSelectedTournamentId(tournament.id);
                                    void enrollTeam(team.id);
                                  }}
                                >
                                  + {team.name}
                                </Button>
                              ))
                            ) : (
                              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Sin resultados para esa búsqueda.</p>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Equipos inscritos: {tournament.teamIds.length} / {tournament.teamsRequired}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        <section ref={fixtureSectionRef}>
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
                        <p className="text-sm font-semibold text-black">
                          Partido #{match.id}
                          {currentTournament.format === "eliminatorio" ? ` · Ronda ${match.round}` : ""}
                        </p>
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

            {message ? <MessageBanner message={message} /> : null}

            <Button type="button" className="w-full" disabled={savingResult} onClick={saveMatchResult}>
              {savingResult ? "Guardando…" : "Guardar resultado"}
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

