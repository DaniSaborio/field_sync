"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Row, RowTag } from "@/components/ui/row";
import { fieldClassName } from "./constants";
import { Badge, MessageBanner, PanelShell } from "./shared-ui";
import type { ApiResponse, AppUser, CourtCard, TeamCard, UserOption } from "./types";
import { displayName, humanRole, readJson, todayIso } from "./utils";

export function TeamsPanel({ user }: { user: AppUser }) {
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [courts, setCourts] = useState<CourtCard[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);

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

  async function addPlayerToTeam(playerId: number) {
    if (!selectedTeamId) return;
    setMessage("");
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "roster", teamId: selectedTeamId, playerId, rosterAction: "add" }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos agregar al jugador");
      return;
    }
    setMessage("Jugador agregado a la plantilla.");
    setAddPlayerOpen(false);
    setPlayerSearch("");
    await loadTeams();
  }

  async function removePlayer(teamId: number, playerId: number) {
    setMessage("");
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "roster", teamId, playerId, rosterAction: "remove" }),
    });
    const payload = await readJson<ApiResponse<Record<string, never>>>(response);
    if (!response.ok) {
      setMessage(payload.error || "No pudimos eliminar al jugador");
      return;
    }
    setMessage("Jugador eliminado de la plantilla.");
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <select className={fieldClassName} value={selectedTeamId ?? ""} onChange={(event) => setSelectedTeamId(event.target.value ? Number(event.target.value) : null)}>
                <option value="">Selecciona un equipo</option>
                {myTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black" aria-hidden />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!selectedTeamId}
              onClick={() => setAddPlayerOpen(true)}
              title={!selectedTeamId ? "Elegí un equipo primero" : undefined}
            >
              Agregar jugador
            </Button>
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

      <Modal
        open={addPlayerOpen}
        onClose={() => {
          setAddPlayerOpen(false);
          setPlayerSearch("");
        }}
        title="Agregar jugador"
      >
        <div className="gap-3 flex flex-col">
          <input
            type="search"
            autoFocus
            placeholder="Buscar por nombre, apodo o correo…"
            value={playerSearch}
            onChange={(event) => setPlayerSearch(event.target.value)}
            className={fieldClassName}
          />
          <div className="max-h-80 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              <ul>
                {filteredUsers.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => addPlayerToTeam(candidate.id)}
                      className="flex w-full items-center justify-between gap-3 border-b border-black py-3 pl-3 pr-1 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName(candidate)}</p>
                        <p className="truncate font-mono text-[11px] uppercase tracking-wider text-muted">{candidate.email}</p>
                      </div>
                      <RowTag>{humanRole(candidate.role)}</RowTag>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Sin resultados para esa búsqueda.</p>
            )}
          </div>
        </div>
      </Modal>

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
              {team.players.map((player) => {
                const isCaptain = player?.id === team.captainUserId;
                return (
                  <Row
                    key={player?.id ?? `${team.id}-empty`}
                    title={player ? displayName(player) : "Vacante"}
                    disabled={!player}
                    right={
                      player ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isCaptain}
                          title={isCaptain ? "El capitán no puede ser eliminado de su propia plantilla" : "Eliminar jugador"}
                          onClick={() => {
                            if (window.confirm(`¿Eliminar a ${displayName(player)} de ${team.name}?`)) {
                              void removePlayer(team.id, player.id);
                            }
                          }}
                        >
                          <Trash2 size={14} strokeWidth={2} aria-hidden />
                        </Button>
                      ) : null
                    }
                  />
                );
              })}
            </ul>
          </Card>
        )) : <p className="font-mono text-[11px] uppercase tracking-wider text-muted">No pertenecés a ninguna plantilla todavía.</p>}
      </div>
    </PanelShell>
  );
}

