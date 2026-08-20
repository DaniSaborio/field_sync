"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RowTag } from "@/components/ui/row";
import { fieldClassName } from "./constants";
import { Badge, MessageBanner, PanelShell, StatusPill } from "./shared-ui";
import type { ApiResponse, AppUser, CourtCard, TeamCard, TournamentCard } from "./types";
import { formatDateTime, readJson, todayIso } from "./utils";

export function MyTournamentsPanel({ user }: { user: AppUser }) {
  const [tournaments, setTournaments] = useState<TournamentCard[]>([]);
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [courts, setCourts] = useState<CourtCard[]>([]);
  const [message, setMessage] = useState("");
  const [requestForm, setRequestForm] = useState<{
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  function toggleRequestFormTeam(teamId: number) {
    setRequestForm((current) => ({
      ...current,
      teamIds: current.teamIds.includes(teamId)
        ? current.teamIds.filter((id) => id !== teamId)
        : [...current.teamIds, teamId],
    }));
  }

  const [teamSearch, setTeamSearch] = useState("");
  const filteredTeamsForRequest = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [teams, teamSearch]);

  async function requestTournament() {
    setMessage("");
    if (!requestForm.name.trim()) {
      setMessage("Ponele un nombre al torneo");
      return;
    }
    if (!requestForm.courtId) {
      setMessage("Selecciona la cancha donde te gustaría jugar el torneo");
      return;
    }
    if (requestForm.teamIds.length < 2) {
      setMessage("Selecciona al menos dos equipos participantes");
      return;
    }

    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", userId: user.id, role: user.role, ...requestForm }),
    });
    const payload = await readJson<ApiResponse<{ tournament?: TournamentCard }>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos enviar la solicitud");
      return;
    }
    setMessage("Solicitud enviada al dueño de la cancha. Te avisaremos cuando la revise.");
    setRequestForm((current) => ({ ...current, name: "", courtId: null, teamIds: [] }));
    await load();
  }

  function teamName(teamId: number) {
    return teams.find((team) => team.id === teamId)?.name ?? `Equipo #${teamId}`;
  }

  function courtName(courtId: number) {
    return courts.find((court) => court.id === courtId)?.name ?? `Cancha #${courtId}`;
  }

  return (
    <div className="space-y-8">
      <PanelShell
        title="Solicitar un torneo"
        description="Completá los datos y el dueño de la cancha revisará tu solicitud antes de aprobarla."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input className={fieldClassName} placeholder="Nombre del torneo" value={requestForm.name} onChange={(event) => setRequestForm((current) => ({ ...current, name: event.target.value }))} />
          <div className="relative">
            <select className={fieldClassName} value={requestForm.format} onChange={(event) => setRequestForm((current) => ({ ...current, format: event.target.value }))}>
              <option value="todos-contra-todos">Todos contra todos</option>
              <option value="eliminatorio">Eliminatorio</option>
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          <div className="relative">
            <select className={fieldClassName} value={requestForm.fixtureMode} onChange={(event) => setRequestForm((current) => ({ ...current, fixtureMode: event.target.value === "manual" ? "manual" : "aleatorio" }))}>
              <option value="aleatorio">Calendario aleatorio</option>
              <option value="manual">Calendario manual</option>
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          <div className="relative">
            <select className={fieldClassName} value={requestForm.courtId ?? ""} onChange={(event) => setRequestForm((current) => ({ ...current, courtId: event.target.value ? Number(event.target.value) : null }))}>
              <option value="">Selecciona la cancha</option>
              {courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
            </select>
            <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
          </div>
          <Button type="button" onClick={requestTournament}>Solicitar torneo</Button>
        </div>
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            Equipos participantes ({requestForm.teamIds.length} seleccionados)
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
            ) : filteredTeamsForRequest.length > 0 ? (
              filteredTeamsForRequest.map((team) => {
                const isSelected = requestForm.teamIds.includes(team.id);
                return (
                  <Button
                    key={team.id}
                    type="button"
                    variant={isSelected ? "default" : "secondary"}
                    size="sm"
                    onClick={() => toggleRequestFormTeam(team.id)}
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
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="date" className={fieldClassName} value={requestForm.startDate} onChange={(event) => setRequestForm((current) => ({ ...current, startDate: event.target.value }))} />
          <input type="date" className={fieldClassName} value={requestForm.endDate} onChange={(event) => setRequestForm((current) => ({ ...current, endDate: event.target.value }))} />
        </div>
        {message ? <div className="mt-4"><MessageBanner message={message} /></div> : null}
      </PanelShell>

      <PanelShell
        title="Mis torneos"
        description="Torneos en los que participás junto con el calendario de partidos y la tabla de posiciones."
        action={<StatusPill>{myTournaments.length} torneos</StatusPill>}
      >
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
                <div className="flex flex-col items-end gap-1.5">
                  <Badge>{tournament.status}</Badge>
                  <RowTag tone={tournament.requestStatus === "aprobado" ? "positive" : tournament.requestStatus === "rechazado" ? "negative" : "default"}>
                    {tournament.requestStatus === "pendiente" ? "Solicitud pendiente" : tournament.requestStatus === "aprobado" ? "Aprobado" : "Rechazado"}
                  </RowTag>
                </div>
              </div>
              {tournament.requestStatus === "rechazado" && tournament.rejectionReason ? (
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Motivo: {tournament.rejectionReason}</p>
              ) : null}

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
    </div>
  );
}
