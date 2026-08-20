import { prisma } from "./prisma";
import { notifyPush } from "./notify";

export type UserRole = "administrador" | "recepcionista" | "organizador" | "jugador";

export type CourtSurface = "synthetic" | "natural" | "indoor";
export type TournamentFormat = "eliminatorio" | "todos-contra-todos";
export type TournamentFixtureMode = "aleatorio" | "manual";
export type MatchStatus = "scheduled" | "confirmed";
export type NotificationType = "reservation" | "cancellation" | "tournament" | "convocation" | "match-result" | "payment-split" | "match-invite" | "payment-pending" | "account-status";

export type UserRecord = {
  id: number;
  fullName: string;
  nickname: string | null;
  email: string;
  password: string;
  role: UserRole;
  tenantId: number;
  notificationsEnabled: boolean;
};

export type CourtRecord = {
  id: number;
  tenantId: number;
  name: string;
  location: string;
  mapsUrl?: string | null;
  surface: CourtSurface;
  capacity: string;
  pricePerHour: number;
  pricePerHourNight?: number | null;
  rating: number;
  availableSlots: string[];
};

export type PaymentMethod = "sinpe" | "efectivo";
export type ReservationStatus = "pendiente" | "confirmada" | "rechazada" | "cancelada";
export type PaymentStatus = "pendiente" | "verificado" | "rechazado";

export type ReservationRecord = {
  id: number;
  userId: number;
  courtId: number;
  date: string;
  timeSlot: string;
  status: ReservationStatus;
  createdAt: string;
  holdExpiresAt: string | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  rejectionReason: string | null;
  amount: number | null;
  teamId: number | null;
  rivalTeamId: number | null;
  paidPlayerIds: number[];
};

export type NotificationRecord = {
  id: number;
  userId: number;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
};

export type TeamRecord = {
  id: number;
  tenantId: number;
  name: string;
  captainUserId: number;
  playerIds: number[];
};

export type TournamentRequestStatus = "pendiente" | "aprobado" | "rechazado";

export type TournamentRecord = {
  id: number;
  tenantId: number;
  createdByUserId: number;
  courtId: number;
  name: string;
  format: TournamentFormat;
  fixtureMode: TournamentFixtureMode;
  teamsRequired: number;
  startDate: string;
  endDate: string;
  status: "draft" | "active";
  // Solicitud de torneo: el dueño de la cancha (tenant) debe aprobar antes de poder
  // inscribir equipos o iniciar el fixture.
  requestStatus: TournamentRequestStatus;
  rejectionReason: string | null;
  teamIds: number[];
  fixture: MatchRecord[];
};

export type MatchRecord = {
  id: number;
  tournamentId: number;
  homeTeamId: number;
  awayTeamId: number;
  scheduledAt: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: MatchStatus;
  resultLocked: boolean;
  auditTrail: string[];
};

// Una fila por jugador por partido: sus goles y tarjetas en ese partido.
// El marcador del equipo sale de sumar los goles de sus jugadores, no de un
// número suelto tipeado por quien carga el resultado.
export type MatchStatRecord = {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  goals: number;
  yellowCards: number;
  redCards: number;
};

export type PlayerProfileRecord = {
  id: number;
  userId: number;
  goals: number;
  assists: number;
  matchesPlayed: number;
  tournaments: string[];
  courts: string[];
  visibility: "public" | "private";
};

export type StandingRecord = {
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

type StoreState = {
  nextIds: Record<string, number>;
  users: UserRecord[];
  courts: CourtRecord[];
  reservations: ReservationRecord[];
  notifications: NotificationRecord[];
  teams: TeamRecord[];
  tournaments: TournamentRecord[];
  matches: MatchRecord[];
  matchStats: MatchStatRecord[];
  standings: StandingRecord[];
  playerProfiles: PlayerProfileRecord[];
};

export type ReservationFilter = {
  date?: string;
  timeSlot?: string;
  surface?: string;
  userId?: number;
};

export type TournamentResult =
  | {
      ok: true;
      tournament: TournamentRecord;
      notifications: NotificationRecord[];
    }
  | {
      ok: false;
      error: string;
    };

export type MatchResultUpdate =
  | {
      ok: true;
      match: MatchRecord;
      standings: StandingRecord[];
      notifications: NotificationRecord[];
    }
  | {
      ok: false;
      error: string;
      requiresSecondAuthorization?: boolean;
      auditTrail?: string[];
    };

export type TeamResult =
  | {
      ok: true;
      team: TeamRecord;
    }
  | {
      ok: false;
      error: string;
    };

export type TeamRosterUpdate =
  | {
      ok: true;
      team: TeamRecord;
      notifications: NotificationRecord[];
    }
  | {
      ok: false;
      error: string;
    };

export type ConvocationResult =
  | {
      ok: true;
      notifications: NotificationRecord[];
    }
  | {
      ok: false;
      error: string;
    };

const seedState = (): StoreState => ({
  nextIds: {
    user: 5,
    court: 5,
    reservation: 3,
    notification: 4,
    team: 4,
    tournament: 3,
    match: 5,
    matchStat: 1,
    standing: 1,
    profile: 4,
  },
  users: [
    {
      id: 1,
      fullName: "Admin FieldSync",
      nickname: null,
      email: "admin@fieldsync.test",
      password: "Admin1234!",
      role: "administrador",
      tenantId: 1,
      notificationsEnabled: true,
    },
    {
      id: 2,
      fullName: "Recepción Principal",
      nickname: null,
      email: "recepcion@fieldsync.test",
      password: "Recepcion1234!",
      role: "recepcionista",
      tenantId: 1,
      notificationsEnabled: true,
    },
    {
      id: 3,
      fullName: "Capitán Deportivo",
      nickname: "Capi",
      email: "capitan@fieldsync.test",
      password: "Capitan1234!",
      role: "organizador",
      tenantId: 1,
      notificationsEnabled: true,
    },
    {
      id: 4,
      fullName: "Jugador Demo",
      nickname: "Duki",
      email: "jugador@fieldsync.test",
      password: "Jugador1234!",
      role: "jugador",
      tenantId: 1,
      notificationsEnabled: true,
    },
  ],
  courts: [
    {
      id: 1,
      tenantId: 1,
      name: "Complejo Norte - Cancha A",
      location: "Av. Central 1420",
      surface: "synthetic",
      capacity: "5 vs 5",
      pricePerHour: 55,
      rating: 4.8,
      availableSlots: ["08:00", "09:30", "18:00", "20:00"],
    },
    {
      id: 2,
      tenantId: 1,
      name: "Estadio Barrial - Cancha 2",
      location: "Calle 25 #430",
      surface: "natural",
      capacity: "7 vs 7",
      pricePerHour: 68,
      rating: 4.6,
      availableSlots: ["11:00", "13:00", "17:30"],
    },
    {
      id: 3,
      tenantId: 1,
      name: "Arena Indoor Center",
      location: "Boulevard Sur 990",
      surface: "indoor",
      capacity: "6 vs 6",
      pricePerHour: 72,
      rating: 4.9,
      availableSlots: ["09:00", "15:00", "19:00", "21:00"],
    },
    {
      id: 4,
      tenantId: 1,
      name: "Canchas del Lago - C",
      location: "Ruta 3 km 5",
      surface: "synthetic",
      capacity: "8 vs 8",
      pricePerHour: 64,
      rating: 4.5,
      availableSlots: ["10:30", "12:00", "16:30"],
    },
  ],
  reservations: [
    {
      id: 1,
      userId: 4,
      courtId: 1,
      date: "2026-07-30",
      timeSlot: "18:00",
      status: "confirmada",
      createdAt: "2026-07-20T10:00:00.000Z",
      holdExpiresAt: null,
      paymentMethod: "sinpe",
      paymentStatus: "verificado",
      rejectionReason: null,
      amount: 55,
      teamId: null,
      rivalTeamId: null,
      paidPlayerIds: [],
    },
    {
      id: 2,
      userId: 4,
      courtId: 3,
      date: "2026-07-29",
      timeSlot: "15:00",
      status: "confirmada",
      createdAt: "2026-07-20T11:00:00.000Z",
      holdExpiresAt: null,
      paymentMethod: "efectivo",
      paymentStatus: "verificado",
      rejectionReason: null,
      amount: 72,
      teamId: null,
      rivalTeamId: null,
      paidPlayerIds: [],
    },
  ],
  notifications: [
    {
      id: 1,
      userId: 4,
      type: "reservation",
      message: "Reserva confirmada para Complejo Norte - Cancha A a las 18:00.",
      createdAt: "2026-07-20T10:00:05.000Z",
      read: false,
    },
    {
      id: 2,
      userId: 4,
      type: "reservation",
      message: "Reserva confirmada para Arena Indoor Center a las 15:00.",
      createdAt: "2026-07-20T11:00:05.000Z",
      read: false,
    },
    {
      id: 3,
      userId: 3,
      type: "tournament",
      message: "Calendario disponible para el Torneo Apertura 2026.",
      createdAt: "2026-07-21T09:00:00.000Z",
      read: false,
    },
  ],
  teams: [
    {
      id: 1,
      tenantId: 1,
      name: "Tigres del Barrio",
      captainUserId: 3,
      playerIds: [3, 4],
    },
    {
      id: 2,
      tenantId: 1,
      name: "Norte FC",
      captainUserId: 3,
      playerIds: [3],
    },
    {
      id: 3,
      tenantId: 1,
      name: "Arena United",
      captainUserId: 3,
      playerIds: [3, 4],
    },
  ],
  tournaments: [
    {
      id: 1,
      tenantId: 1,
      createdByUserId: 3,
      courtId: 1,
      name: "Torneo Apertura 2026",
      format: "todos-contra-todos",
      fixtureMode: "aleatorio",
      teamsRequired: 3,
      startDate: "2026-07-25",
      endDate: "2026-08-15",
      status: "active",
      requestStatus: "aprobado",
      rejectionReason: null,
      teamIds: [1, 2, 3],
      fixture: [],
    },
  ],
  matches: [
    {
      id: 1,
      tournamentId: 1,
      homeTeamId: 1,
      awayTeamId: 2,
      scheduledAt: "2026-07-28T19:00:00.000Z",
      homeGoals: 2,
      awayGoals: 1,
      status: "confirmed",
      resultLocked: true,
      auditTrail: ["Resultado inicial confirmado"],
    },
    {
      id: 2,
      tournamentId: 1,
      homeTeamId: 2,
      awayTeamId: 3,
      scheduledAt: "2026-07-30T19:00:00.000Z",
      homeGoals: null,
      awayGoals: null,
      status: "scheduled",
      resultLocked: false,
      auditTrail: [],
    },
    {
      id: 3,
      tournamentId: 1,
      homeTeamId: 3,
      awayTeamId: 1,
      scheduledAt: "2026-08-02T19:00:00.000Z",
      homeGoals: null,
      awayGoals: null,
      status: "scheduled",
      resultLocked: false,
      auditTrail: [],
    },
  ],
  matchStats: [],
  standings: [
    {
      teamId: 1,
      tournamentId: 1,
      played: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      goalsFor: 2,
      goalsAgainst: 1,
      points: 3,
    },
    {
      teamId: 2,
      tournamentId: 1,
      played: 1,
      wins: 0,
      draws: 0,
      losses: 1,
      goalsFor: 1,
      goalsAgainst: 2,
      points: 0,
    },
    {
      teamId: 3,
      tournamentId: 1,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    },
  ],
  playerProfiles: [
    {
      id: 1,
      userId: 4,
      goals: 4,
      assists: 2,
      matchesPlayed: 5,
      tournaments: ["Torneo Apertura 2026"],
      courts: ["Complejo Norte - Cancha A", "Arena Indoor Center"],
      visibility: "public",
    },
    {
      id: 2,
      userId: 3,
      goals: 3,
      assists: 5,
      matchesPlayed: 6,
      tournaments: ["Torneo Apertura 2026"],
      courts: ["Complejo Norte - Cancha A"],
      visibility: "public",
    },
  ],
});

const store: StoreState = seedState();

function nextId(key: keyof StoreState["nextIds"]) {
  const current = store.nextIds[key];
  store.nextIds[key] += 1;
  return current;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function formatDateTime(date: string, timeSlot: string) {
  return new Date(`${date}T${timeSlot}:00.000Z`);
}

// Una reserva bloquea el horario si está "confirmada", o "pendiente" mientras
// el hold no venza (esperando que el dueño de la cancha verifique el pago).
function isSlotActive(reservation: ReservationRecord, now: Date = new Date()) {
  if (reservation.status === "confirmada") return true;
  if (reservation.status === "pendiente") {
    return !reservation.holdExpiresAt || new Date(reservation.holdExpiresAt).getTime() > now.getTime();
  }
  return false;
}

function createNotification(userId: number, type: NotificationType, message: string) {
  const notification: NotificationRecord = {
    id: nextId("notification"),
    userId,
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };

  store.notifications.push(notification);
  return notification;
}

function findUserById(userId: number) {
  return store.users.find((user) => user.id === userId) ?? null;
}

// Equipos, torneos y perfiles viven solo en este store en memoria, separado de
// los usuarios reales de Postgres — así que cualquier usuario que no sea uno
// de los 4 de la semilla de demo (cualquier registro nuevo o inicio de sesión
// con Google) es invisible para findUserById hasta que se registre aquí una
// vez. Las rutas de API llaman a esto para sincronizar un usuario real antes
// de operarlo (agregarlo a una plantilla, consultar su perfil, etc.).
export function upsertStoreUser(input: {
  id: number;
  fullName: string;
  nickname?: string | null;
  email: string;
  role: UserRole;
  tenantId: number;
  notificationsEnabled: boolean;
}): UserRecord {
  const existing = store.users.find((user) => user.id === input.id);
  if (existing) {
    existing.fullName = input.fullName;
    existing.nickname = input.nickname ?? null;
    existing.email = input.email;
    existing.notificationsEnabled = input.notificationsEnabled;
    return existing;
  }

  const record: UserRecord = {
    id: input.id,
    fullName: input.fullName,
    nickname: input.nickname ?? null,
    email: input.email,
    password: "",
    role: input.role,
    tenantId: input.tenantId,
    notificationsEnabled: input.notificationsEnabled,
  };
  store.users.push(record);
  ensureProfile(input.id);
  return record;
}

function findUserByEmail(email: string) {
  return store.users.find((user) => user.email === normalizeEmail(email)) ?? null;
}

function ensureProfile(userId: number) {
  const existingProfile = store.playerProfiles.find((profile) => profile.userId === userId);
  if (existingProfile) {
    return existingProfile;
  }

  const profile: PlayerProfileRecord = {
    id: nextId("profile"),
    userId,
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
    tournaments: [],
    courts: [],
    visibility: "public",
  };

  store.playerProfiles.push(profile);
  return profile;
}

async function recalculateStandings(tournamentId: number) {
  const tournament = store.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) {
    return [] as StandingRecord[];
  }

  const tournamentMatches = store.matches.filter((match) => match.tournamentId === tournamentId && match.status === "confirmed" && match.homeGoals !== null && match.awayGoals !== null);
  const teamIds = new Set<number>(tournament.teamIds);

  const standingsByTeam = new Map<number, StandingRecord>();
  for (const teamId of teamIds) {
    standingsByTeam.set(teamId, {
      teamId,
      tournamentId,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }

  for (const match of tournamentMatches) {
    const home = standingsByTeam.get(match.homeTeamId);
    const away = standingsByTeam.get(match.awayTeamId);
    if (!home || !away || match.homeGoals === null || match.awayGoals === null) {
      continue;
    }

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeGoals;
    home.goalsAgainst += match.awayGoals;
    away.goalsFor += match.awayGoals;
    away.goalsAgainst += match.homeGoals;

    if (match.homeGoals > match.awayGoals) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.homeGoals < match.awayGoals) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = Array.from(standingsByTeam.values()).sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    const leftDiff = left.goalsFor - left.goalsAgainst;
    const rightDiff = right.goalsFor - right.goalsAgainst;
    if (rightDiff !== leftDiff) return rightDiff - leftDiff;
    return right.goalsFor - left.goalsFor;
  });

  await prisma.$transaction(
    standings.map((standing, index) =>
      prisma.standing.upsert({
        where: { id_tournament_id_team: { id_tournament: tournamentId, id_team: standing.teamId } },
        update: {
          points: standing.points,
          matches_played: standing.played,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          goals_for: standing.goalsFor,
          goals_against: standing.goalsAgainst,
          goal_difference: standing.goalsFor - standing.goalsAgainst,
          position: index + 1,
        },
        create: {
          id_tournament: tournamentId,
          id_team: standing.teamId,
          points: standing.points,
          matches_played: standing.played,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          goals_for: standing.goalsFor,
          goals_against: standing.goalsAgainst,
          goal_difference: standing.goalsFor - standing.goalsAgainst,
          position: index + 1,
        },
      }),
    ),
  );

  store.standings = store.standings.filter((standing) => standing.tournamentId !== tournamentId).concat(standings);
  return standings;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Solo se llama para torneos en modo "aleatorio" (el modo "manual" arma los
// pares a mano en setManualFixture) — por eso siempre sortea el orden de los
// equipos antes de emparejarlos. Pura: no toca la base ni el store, solo
// calcula los enfrentamientos; persistFixture se encarga de guardarlos.
function buildFixturePairs(tournament: TournamentRecord): Array<{ homeTeamId: number; awayTeamId: number }> {
  const teamIds = shuffle(tournament.teamIds);
  const pairs: Array<{ homeTeamId: number; awayTeamId: number }> = [];

  if (tournament.format === "todos-contra-todos") {
    for (let homeIndex = 0; homeIndex < teamIds.length; homeIndex += 1) {
      for (let awayIndex = homeIndex + 1; awayIndex < teamIds.length; awayIndex += 1) {
        pairs.push({ homeTeamId: teamIds[homeIndex], awayTeamId: teamIds[awayIndex] });
      }
    }
  } else {
    for (let index = 0; index < teamIds.length - 1; index += 2) {
      pairs.push({ homeTeamId: teamIds[index], awayTeamId: teamIds[index + 1] });
    }
  }

  return pairs;
}

async function persistFixture(tournament: TournamentRecord, pairs: Array<{ homeTeamId: number; awayTeamId: number }>): Promise<MatchRecord[]> {
  const created = await prisma.match.createManyAndReturn({
    data: pairs.map((pair, index) => ({
      id_tournament: tournament.id,
      id_court: tournament.courtId,
      id_home_team: pair.homeTeamId,
      id_away_team: pair.awayTeamId,
      scheduled_at: new Date(Date.UTC(2026, 6, 28 + index, 19, 0, 0)),
      status: "scheduled",
    })),
  });

  const matches: MatchRecord[] = created.map((m) => ({
    id: m.id_match,
    tournamentId: tournament.id,
    homeTeamId: m.id_home_team,
    awayTeamId: m.id_away_team,
    scheduledAt: m.scheduled_at.toISOString(),
    homeGoals: null,
    awayGoals: null,
    status: "scheduled",
    resultLocked: false,
    auditTrail: [],
  }));

  tournament.fixture = matches;
  store.matches.push(...matches);
  return matches;
}

export function resetFieldSyncStore() {
  const freshState = seedState();
  store.nextIds = freshState.nextIds;
  store.users = freshState.users;
  store.courts = freshState.courts;
  store.reservations = freshState.reservations;
  store.notifications = freshState.notifications;
  store.teams = freshState.teams;
  store.tournaments = freshState.tournaments;
  store.matches = freshState.matches;
  store.standings = freshState.standings;
  store.playerProfiles = freshState.playerProfiles;
}

export function loginUser(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return null;
  }

  return clone({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    nickname: user.nickname,
    role: user.role,
    tenantId: user.tenantId,
    notificationsEnabled: user.notificationsEnabled,
  });
}

export function registerUser(input: {
  fullName: string;
  nickname?: string | null;
  email: string;
  password: string;
  role?: UserRole;
}) {
  const email = normalizeEmail(input.email);
  if (!input.fullName.trim()) {
    return { ok: false, error: "El nombre completo es obligatorio" } as const;
  }

  if (store.users.some((user) => user.email === email)) {
    return { ok: false, error: "Ya existe una cuenta con ese correo" } as const;
  }

  const user: UserRecord = {
    id: nextId("user"),
    fullName: input.fullName.trim(),
    nickname: input.nickname?.trim() || null,
    email,
    password: input.password,
    role: input.role ?? "jugador",
    tenantId: 1,
    notificationsEnabled: true,
  };

  store.users.push(user);
  ensureProfile(user.id);

  return {
    ok: true as const,
    user: clone({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      nickname: user.nickname,
      role: user.role,
      tenantId: user.tenantId,
      notificationsEnabled: user.notificationsEnabled,
    }),
  };
}

// Espejo en memoria de lib/reservation-expiry.ts: una reserva "pendiente"
// cuya hora ya pasó nunca se resuelve sola (el hold de 30 min solo libera el
// horario para otros, no cierra la reserva). Se vence de forma perezosa cada
// vez que se lee el store, y notifica tanto al cliente como al dueño.
function expireStaleReservations(now: Date = new Date()) {
  const notifications: NotificationRecord[] = [];

  for (const reservation of store.reservations) {
    if (reservation.status !== "pendiente") continue;
    if (formatDateTime(reservation.date, reservation.timeSlot).getTime() > now.getTime()) continue;

    reservation.status = "cancelada";
    reservation.paymentStatus = "rechazado";
    reservation.rejectionReason = "Vencida: la hora de la reserva pasó sin confirmación de pago.";
    reservation.holdExpiresAt = null;

    const court = store.courts.find((item) => item.id === reservation.courtId);
    if (!court) continue;

    const user = findUserById(reservation.userId);
    if (user?.notificationsEnabled) {
      notifications.push(
        createNotification(
          reservation.userId,
          "cancellation",
          `Tu reserva en ${court.name} para ${reservation.date} ${reservation.timeSlot} venció y se canceló automáticamente porque no se confirmó el pago a tiempo.`,
        ),
      );
    }

    const ownerNotification = notifyCourtOwner(
      court,
      "cancellation",
      `La reserva pendiente en ${court.name} para ${reservation.date} ${reservation.timeSlot} venció sin confirmación de pago y se canceló automáticamente.`,
    );
    if (ownerNotification) {
      notifications.push(ownerNotification);
    }
  }

  return notifications;
}

export function listCourts(filters: ReservationFilter = {}) {
  expireStaleReservations();
  const date = filters.date?.trim();
  const timeSlot = filters.timeSlot?.trim();
  const surface = filters.surface?.trim();
  const userId = filters.userId;

  const visibleCourts = store.courts.filter((court) => {
    if (surface && surface !== "all" && court.surface !== surface) {
      return false;
    }
    return true;
  }).map((court) => {
    const reservedSlots = store.reservations.filter((reservation) => reservation.courtId === court.id && isSlotActive(reservation) && (!date || reservation.date === date)).map((reservation) => reservation.timeSlot);

    const slots = court.availableSlots.filter((slot) => {
      if (timeSlot && timeSlot !== "all") {
        const [hourText] = slot.split(":");
        const hour = Number(hourText);
        if (timeSlot === "morning" && hour >= 12) {
          return false;
        }
        if (timeSlot === "afternoon" && (hour < 12 || hour >= 18)) {
          return false;
        }
        if (timeSlot === "night" && hour < 18) {
          return false;
        }
      }

      return !reservedSlots.includes(slot);
    });

    return {
      ...clone(court),
      pricePerHourNight: court.pricePerHourNight ?? null,
      rates: { morning: null, afternoon: null, night: court.pricePerHourNight ?? null },
      availableSlots: slots,
      reservations: store.reservations
        .filter((reservation) => reservation.courtId === court.id && reservation.status !== "cancelada" && (!date || reservation.date === date) && (!userId || reservation.userId === userId))
        .map((reservation) => {
          const player = findUserById(reservation.userId);
          return {
            ...clone(reservation),
            playerName: player?.nickname || player?.fullName || null,
            playerEmail: player?.email ?? null,
          };
        }),
    };
  }).filter((court) => court.availableSlots.length > 0 || court.reservations.length > 0);

  return clone(visibleCourts);
}

export function getReservations(userId?: number) {
  expireStaleReservations();
  const reservations = store.reservations.filter((reservation) => (userId ? reservation.userId === userId : true));
  return clone(reservations);
}

// --- Persistencia real de plantillas (Postgres) ---
// Las plantillas se crean/editan acá pero las funciones de torneos (fixture,
// standings, chequeo de jugadores compartidos) siguen leyendo store.teams de
// forma síncrona sin cambios: en vez de reescribir todo ese motor a async,
// mantenemos store.teams como un espejo en memoria que se hidrata desde
// Postgres una vez por proceso (y se actualiza en cada escritura), así un
// reinicio del contenedor ya no borra las plantillas — solo hace falta un
// primer request que dispare la hidratación.
let teamsHydrated = false;

async function ensurePlayerProfile(userId: number) {
  await prisma.playerProfile.upsert({
    where: { id_user: userId },
    update: {},
    create: { id_user: userId, visibility: "public", is_available: true },
  });
  return prisma.playerProfile.findUniqueOrThrow({ where: { id_user: userId } });
}

async function hydrateTeamsFromDb() {
  const dbTeams = await prisma.team.findMany({
    include: { team_players: { where: { is_active: true }, include: { player_profile: { include: { user: { include: { role: true } } } } } } },
    orderBy: { id_team: "asc" },
  });

  const involvedUserIds = new Set<number>();
  for (const team of dbTeams) {
    involvedUserIds.add(team.id_user);
    for (const tp of team.team_players) involvedUserIds.add(tp.player_profile.id_user);
  }

  const dbUsers = await prisma.user.findMany({
    where: { id_user: { in: Array.from(involvedUserIds) } },
    include: { role: true },
  });
  for (const dbUser of dbUsers) {
    upsertStoreUser({
      id: dbUser.id_user,
      fullName: dbUser.full_name,
      nickname: dbUser.nickname,
      email: dbUser.email,
      role: dbUser.role.name === "admin_plataforma" ? "administrador" : dbUser.role.name === "tenant" ? "organizador" : "jugador",
      tenantId: dbUser.role.name === "tenant" ? dbUser.id_user : 1,
      notificationsEnabled: dbUser.notifications_enabled,
    });
  }

  store.teams = dbTeams.map((team) => ({
    id: team.id_team,
    tenantId: team.id_tenant,
    name: team.name,
    captainUserId: team.id_user,
    playerIds: team.team_players.map((tp) => tp.player_profile.id_user),
  }));
}

export async function ensureTeamsHydrated() {
  if (teamsHydrated) return;
  await hydrateTeamsFromDb();
  teamsHydrated = true;
}

// Mismo patrón que hydrateTeamsFromDb: torneos/partidos/standings ya se
// escriben en Postgres, pero createTournament/recordMatchResult/etc. siguen
// leyendo store.tournaments/store.matches/store.standings de forma síncrona
// (fixture, standings y validación de jugadores compartidos comparten mucho
// código con la lógica de equipos). Por eso se hidrata un espejo en memoria
// una vez por proceso, y cada escritura lo mantiene al día.
let tournamentsHydrated = false;

async function hydrateTournamentsFromDb() {
  const dbTournaments = await prisma.tournament.findMany({
    include: {
      estado: true,
      team_tournaments: true,
      matches: { include: { match_stats: true }, orderBy: { id_match: "asc" } },
      standings: true,
    },
    orderBy: { id_tournament: "asc" },
  });

  const matches: MatchRecord[] = [];
  const matchStats: MatchStatRecord[] = [];
  const standings: StandingRecord[] = [];

  const tournaments: TournamentRecord[] = dbTournaments.map((t) => {
    for (const m of t.matches) {
      matches.push({
        id: m.id_match,
        tournamentId: t.id_tournament,
        homeTeamId: m.id_home_team,
        awayTeamId: m.id_away_team,
        scheduledAt: m.scheduled_at.toISOString(),
        homeGoals: m.status === "confirmed" ? m.home_goals : null,
        awayGoals: m.status === "confirmed" ? m.away_goals : null,
        status: m.status as MatchStatus,
        resultLocked: m.result_locked,
        auditTrail: m.audit_trail,
      });

      for (const stat of m.match_stats) {
        matchStats.push({
          id: stat.id_match_stat,
          matchId: m.id_match,
          playerId: stat.id_player,
          teamId: stat.id_team,
          goals: stat.goals,
          yellowCards: stat.yellow_cards,
          redCards: stat.red_cards,
        });
      }
    }

    for (const s of t.standings) {
      standings.push({
        teamId: s.id_team,
        tournamentId: t.id_tournament,
        played: s.matches_played,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goalsFor: s.goals_for,
        goalsAgainst: s.goals_against,
        points: s.points,
      });
    }

    return {
      id: t.id_tournament,
      tenantId: t.id_tenant,
      createdByUserId: t.id_requested_by,
      courtId: t.id_court,
      name: t.name,
      format: t.format as TournamentFormat,
      fixtureMode: t.fixture_mode as TournamentFixtureMode,
      teamsRequired: t.min_teams,
      startDate: t.start_date.toISOString().slice(0, 10),
      endDate: t.end_date.toISOString().slice(0, 10),
      status: t.matches.length > 0 ? "active" : "draft",
      requestStatus: t.estado.name as TournamentRequestStatus,
      rejectionReason: t.rejection_reason,
      teamIds: t.team_tournaments.map((tt) => tt.id_team),
      fixture: [],
    };
  });

  store.tournaments = tournaments;
  store.matches = matches;
  store.matchStats = matchStats;
  store.standings = standings;
}

export async function ensureTournamentsHydrated() {
  if (tournamentsHydrated) return;
  await hydrateTournamentsFromDb();
  tournamentsHydrated = true;
}

async function notifyTournamentTenant(tenantId: number, message: string) {
  const owner = await prisma.user.findUnique({ where: { id_user: tenantId } });
  if (!owner || !owner.notifications_enabled) return;
  await prisma.notification.create({ data: { id_user: owner.id_user, type: "tournament", message } });
  notifyPush(owner.id_user, message);
}

export async function notifyTeamMembers(input: {
  teamId: number;
  excludeUserId?: number;
  type: NotificationType;
  message: (member: UserRecord) => string;
}) {
  const team = store.teams.find((item) => item.id === input.teamId);
  if (!team) return;

  await Promise.all(
    team.playerIds
      .filter((playerId) => playerId !== input.excludeUserId)
      .map(async (playerId) => {
        const member = findUserById(playerId);
        if (!member || !member.notificationsEnabled) return;
        const message = input.message(member);
        await prisma.notification.create({ data: { id_user: playerId, type: input.type, message } });
        notifyPush(playerId, message);
      }),
  );
}

export async function notifyTeamCaptain(input: {
  teamId: number;
  type: NotificationType;
  message: string;
}) {
  const team = store.teams.find((item) => item.id === input.teamId);
  if (!team) return;
  const captain = findUserById(team.captainUserId);
  if (!captain || !captain.notificationsEnabled) return;
  await prisma.notification.create({ data: { id_user: team.captainUserId, type: input.type, message: input.message } });
  notifyPush(team.captainUserId, input.message);
}

export function getTeamById(teamId: number) {
  const team = store.teams.find((item) => item.id === teamId);
  return team ? clone(team) : null;
}

function notifyCourtOwner(court: CourtRecord, type: NotificationType, message: string) {
  const owner = store.users.find((candidate) => candidate.tenantId === court.tenantId && candidate.role === "administrador");
  if (!owner || !owner.notificationsEnabled) return null;
  return createNotification(owner.id, type, message);
}

export function listUsers() {
  return clone(store.users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    notificationsEnabled: user.notificationsEnabled,
  })));
}

export function listTeams() {
  return clone(store.teams.map((team) => ({
    ...team,
    players: team.playerIds.map((playerId) => {
      const user = findUserById(playerId);
      return user ? { id: user.id, fullName: user.fullName, nickname: user.nickname, email: user.email } : null;
    }).filter(Boolean),
  })));
}

// Torneos creados por el dueño de la cancha o un admin de plataforma quedan
// aprobados al instante; cualquier otro rol (jugador, capitán/organizador)
// solo puede *solicitar* un torneo, que queda "pendiente" hasta que el
// dueño de la cancha lo revise.
const AUTO_APPROVE_ROLES = ["administrador", "admin_plataforma", "tenant"];

function teamsSharePlayers(teamA: TeamRecord, teamB: TeamRecord): boolean {
  const playersInB = new Set(teamB.playerIds);
  return teamA.playerIds.some((playerId) => playersInB.has(playerId));
}

// Ningún par de equipos dentro de un mismo torneo puede compartir jugadores:
// si comparten, ese jugador podría terminar emparejado contra sí mismo
// cuando el fixture (automático o manual) los haga jugar entre sí.
function findSharedPlayerConflict(teamIds: number[]): { teamA: TeamRecord; teamB: TeamRecord } | null {
  const selectedTeams = teamIds
    .map((id) => store.teams.find((team) => team.id === id))
    .filter((team): team is TeamRecord => Boolean(team));

  for (let i = 0; i < selectedTeams.length; i += 1) {
    for (let j = i + 1; j < selectedTeams.length; j += 1) {
      if (teamsSharePlayers(selectedTeams[i], selectedTeams[j])) {
        return { teamA: selectedTeams[i], teamB: selectedTeams[j] };
      }
    }
  }
  return null;
}

export async function createTournament(input: {
  createdByUserId: number;
  creatorRole?: string;
  tenantId?: number;
  courtId: number;
  name: string;
  format: TournamentFormat;
  fixtureMode?: TournamentFixtureMode;
  teamIds: number[];
  startDate: string;
  endDate: string;
}) : Promise<TournamentResult> {
  if (!input.name.trim()) {
    return { ok: false, error: "El nombre del torneo es obligatorio" };
  }

  const inferredRole = input.creatorRole ?? (input.tenantId ? "tenant" : findUserById(input.createdByUserId)?.role ?? undefined);

  if (!inferredRole) {
    return { ok: false, error: "No pudimos identificar tu rol de usuario" };
  }

  // Las canchas reales viven en Prisma (store.courts es solo la semilla demo
  // en memoria), así que se valida contra la base para reconocer canchas de
  // tenants reales y no solo las 4 de la semilla.
  const court = await prisma.court.findUnique({ where: { id_court: input.courtId } });
  if (!court) {
    return { ok: false, error: "Selecciona una cancha válida para el torneo" };
  }

  const teamIds = Array.from(new Set(input.teamIds));
  if (teamIds.length < 2) {
    return { ok: false, error: "Selecciona al menos dos equipos participantes" };
  }

  const unknownTeamId = teamIds.find((teamId) => !store.teams.some((team) => team.id === teamId));
  if (unknownTeamId !== undefined) {
    return { ok: false, error: `No encontramos el equipo #${unknownTeamId}` };
  }

  const conflict = findSharedPlayerConflict(teamIds);
  if (conflict) {
    return {
      ok: false,
      error: `${conflict.teamA.name} y ${conflict.teamB.name} comparten jugadores: no pueden estar en el mismo torneo`,
    };
  }

  const autoApproved = AUTO_APPROVE_ROLES.includes(inferredRole);
  const fixtureMode: TournamentFixtureMode = input.fixtureMode === "manual" ? "manual" : "aleatorio";
  const estado = await prisma.estado.findUniqueOrThrow({ where: { name: autoApproved ? "aprobado" : "pendiente" } });
  // Los horarios de inicio/fin de partido no los captura ningún formulario
  // hoy (solo se pide la fecha) — se fija una hora por defecto, igual que en
  // la semilla, ya que Tournament.start_time/end_time no se leen en ningún
  // lado de la app.
  const startDateTime = new Date(`${input.startDate}T19:00:00.000Z`);
  const endDateTime = new Date(`${input.endDate}T22:00:00.000Z`);

  const dbTournament = await prisma.tournament.create({
    data: {
      id_tenant: court.id_tenant,
      id_court: court.id_court,
      id_requested_by: input.createdByUserId,
      name: input.name.trim(),
      format: input.format,
      fixture_mode: fixtureMode,
      min_teams: teamIds.length,
      start_date: new Date(`${input.startDate}T00:00:00.000Z`),
      end_date: new Date(`${input.endDate}T00:00:00.000Z`),
      start_time: startDateTime,
      end_time: endDateTime,
      id_estado: estado.id_estado,
      id_approved_by: autoApproved ? input.createdByUserId : null,
      approved_at: autoApproved ? new Date() : null,
      team_tournaments: { create: teamIds.map((id_team) => ({ id_team })) },
    },
  });

  const tournament: TournamentRecord = {
    id: dbTournament.id_tournament,
    tenantId: court.id_tenant,
    createdByUserId: input.createdByUserId,
    courtId: court.id_court,
    name: dbTournament.name,
    format: input.format,
    fixtureMode,
    teamsRequired: teamIds.length,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "draft",
    requestStatus: autoApproved ? "aprobado" : "pendiente",
    rejectionReason: null,
    teamIds,
    fixture: [],
  };

  store.tournaments.push(tournament);

  if (!autoApproved) {
    const requester = findUserById(input.createdByUserId);
    await notifyTournamentTenant(
      court.id_tenant,
      `${requester?.fullName ?? "Un jugador"} solicitó el torneo "${tournament.name}" en ${court.name}. Revisalo para aprobarlo o rechazarlo.`,
    );
  }

  return { ok: true, tournament: clone(tournament), notifications: [] };
}

// El dueño de la cancha (o un admin de plataforma) aprueba o rechaza una
// solicitud de torneo pendiente, y se notifica a quien la pidió.
export async function respondToTournamentRequest(input: {
  tournamentId: number;
  responderId: number;
  responderRole?: string;
  action: "approve" | "reject";
  reason?: string | null;
}) : Promise<TournamentResult> {
  const tournament = store.tournaments.find((item) => item.id === input.tournamentId) ?? null;
  if (!tournament) {
    return { ok: false, error: "No encontramos el torneo" };
  }

  if (tournament.requestStatus !== "pendiente") {
    return { ok: false, error: "Esta solicitud ya fue procesada" };
  }

  const isPlatformAdmin = input.responderRole === "administrador" || input.responderRole === "admin_plataforma";
  if (!isPlatformAdmin && tournament.tenantId !== input.responderId) {
    return { ok: false, error: "Este torneo no pertenece a una de tus canchas" };
  }

  if (input.action === "reject" && !input.reason) {
    return { ok: false, error: "Indica el motivo del rechazo" };
  }

  const estado = await prisma.estado.findUniqueOrThrow({ where: { name: input.action === "approve" ? "aprobado" : "rechazado" } });
  await prisma.tournament.update({
    where: { id_tournament: tournament.id },
    data: {
      id_estado: estado.id_estado,
      rejection_reason: input.action === "reject" ? input.reason ?? null : null,
      id_approved_by: input.action === "approve" ? input.responderId : null,
      approved_at: input.action === "approve" ? new Date() : null,
    },
  });

  tournament.requestStatus = input.action === "approve" ? "aprobado" : "rechazado";
  tournament.rejectionReason = input.action === "reject" ? input.reason ?? null : null;

  const requester = findUserById(tournament.createdByUserId);
  if (requester?.notificationsEnabled) {
    const message = input.action === "approve"
      ? `¡Tu solicitud de torneo "${tournament.name}" fue aprobada! Ya podés inscribir equipos y comenzarlo.`
      : `Tu solicitud de torneo "${tournament.name}" fue rechazada: ${input.reason}.`;
    await prisma.notification.create({ data: { id_user: requester.id, type: "tournament", message } });
    notifyPush(requester.id, message);
  }

  return { ok: true, tournament: clone(tournament), notifications: [] };
}

export async function enrollTeamToTournament(input: {
  tournamentId: number;
  teamId: number;
}) {
  const tournament = store.tournaments.find((item) => item.id === input.tournamentId) ?? null;
  const team = store.teams.find((item) => item.id === input.teamId) ?? null;

  if (!tournament || !team) {
    return { ok: false, error: "No encontramos el torneo o el equipo" } as const;
  }

  if (tournament.requestStatus !== "aprobado") {
    return { ok: false, error: "El torneo aún no ha sido aprobado por el dueño de la cancha" } as const;
  }

  if (!tournament.teamIds.includes(team.id)) {
    const conflict = findSharedPlayerConflict([...tournament.teamIds, team.id]);
    if (conflict) {
      const otherTeam = conflict.teamA.id === team.id ? conflict.teamB : conflict.teamA;
      return { ok: false, error: `${team.name} comparte jugadores con ${otherTeam.name}: no pueden estar en el mismo torneo` } as const;
    }

    await prisma.teamTournament.upsert({
      where: { id_team_id_tournament: { id_team: team.id, id_tournament: tournament.id } },
      update: {},
      create: { id_team: team.id, id_tournament: tournament.id },
    });
    tournament.teamIds.push(team.id);
  }

  return { ok: true as const, tournament: clone(tournament) };
}

async function notifyTournamentStart(tournament: TournamentRecord) {
  const captainTeams = store.teams.filter((team) => tournament.teamIds.includes(team.id));
  await Promise.all(
    captainTeams.map(async (team) => {
      const captain = findUserById(team.captainUserId);
      if (!captain || !captain.notificationsEnabled) return;
      const message = `El torneo ${tournament.name} ya tiene calendario generado.`;
      await prisma.notification.create({ data: { id_user: captain.id, type: "tournament", message } });
      notifyPush(captain.id, message);
    }),
  );
}

function validateTournamentReadyToStart(tournament: TournamentRecord): string | null {
  if (tournament.requestStatus !== "aprobado") {
    return "El torneo aún no ha sido aprobado por el dueño de la cancha";
  }

  if (tournament.teamIds.length < tournament.teamsRequired) {
    return "Aún no se completa el número mínimo de equipos";
  }

  return null;
}

export async function startTournament(input: {
  tournamentId: number;
}) : Promise<TournamentResult> {
  const tournament = store.tournaments.find((item) => item.id === input.tournamentId) ?? null;
  if (!tournament) {
    return { ok: false, error: "No encontramos el torneo" };
  }

  if (tournament.fixtureMode === "manual") {
    return { ok: false, error: "Este torneo usa calendario manual: armá los partidos y guardalos para iniciarlo" };
  }

  const validationError = validateTournamentReadyToStart(tournament);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const pairs = buildFixturePairs(tournament);
  const fixture = await persistFixture(tournament, pairs);
  tournament.status = "active";
  await notifyTournamentStart(tournament);

  return { ok: true, tournament: clone({ ...tournament, fixture }), notifications: [] };
}

export async function setManualFixture(input: {
  tournamentId: number;
  pairs: Array<{ homeTeamId: number; awayTeamId: number }>;
}) : Promise<TournamentResult> {
  const tournament = store.tournaments.find((item) => item.id === input.tournamentId) ?? null;
  if (!tournament) {
    return { ok: false, error: "No encontramos el torneo" };
  }

  if (tournament.fixtureMode !== "manual") {
    return { ok: false, error: "Este torneo no está configurado para calendario manual" };
  }

  const validationError = validateTournamentReadyToStart(tournament);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (input.pairs.length === 0) {
    return { ok: false, error: "Agrega al menos un partido al calendario" };
  }

  for (const pair of input.pairs) {
    if (pair.homeTeamId === pair.awayTeamId) {
      return { ok: false, error: "Un equipo no puede jugar contra sí mismo" };
    }
    if (!tournament.teamIds.includes(pair.homeTeamId) || !tournament.teamIds.includes(pair.awayTeamId)) {
      return { ok: false, error: "Todos los partidos deben ser entre equipos inscritos en el torneo" };
    }

    const homeTeam = store.teams.find((team) => team.id === pair.homeTeamId);
    const awayTeam = store.teams.find((team) => team.id === pair.awayTeamId);
    if (homeTeam && awayTeam && teamsSharePlayers(homeTeam, awayTeam)) {
      return { ok: false, error: `${homeTeam.name} y ${awayTeam.name} comparten jugadores: no pueden enfrentarse` };
    }
  }

  const matches = await persistFixture(tournament, input.pairs);
  tournament.status = "active";
  await notifyTournamentStart(tournament);

  return { ok: true, tournament: clone({ ...tournament, fixture: matches }), notifications: [] };
}

export async function recordMatchResult(input: {
  matchId: number;
  stats?: Array<{ playerId: number; teamId: number; goals: number; yellowCards: number; redCards: number }>;
  homeGoals?: number;
  awayGoals?: number;
  confirmedByAdmin?: boolean;
}) : Promise<MatchResultUpdate> {
  const match = store.matches.find((item) => item.id === input.matchId) ?? null;
  if (!match) {
    return { ok: false, error: "No encontramos el partido" };
  }

  const statRowsFromInput = Array.isArray(input.stats) ? input.stats : [];

  if (match.resultLocked && !input.confirmedByAdmin) {
    match.auditTrail.push("Intento de modificación rechazado: se requiere segunda autorización.");
    await prisma.match.update({ where: { id_match: match.id }, data: { audit_trail: match.auditTrail } });
    return {
      ok: false,
      error: "Se requiere una segunda autorización para modificar un resultado confirmado",
      requiresSecondAuthorization: true,
      auditTrail: clone(match.auditTrail),
    };
  }

  const homeTeam = store.teams.find((team) => team.id === match.homeTeamId);
  const awayTeam = store.teams.find((team) => team.id === match.awayTeamId);

  for (const stat of statRowsFromInput) {
    if (stat.teamId !== match.homeTeamId && stat.teamId !== match.awayTeamId) {
      return { ok: false, error: `El equipo #${stat.teamId} no juega este partido` };
    }
    const team = stat.teamId === match.homeTeamId ? homeTeam : awayTeam;
    if (!team || !team.playerIds.includes(stat.playerId)) {
      return { ok: false, error: `El jugador #${stat.playerId} no pertenece a ${team?.name ?? `equipo #${stat.teamId}`}` };
    }
  }

  // Solo se guardan filas con algo cargado (gol o tarjeta); una fila en cero
  // no cuenta como "jugó" el partido.
  const statRows = statRowsFromInput.filter((stat) => stat.goals > 0 || stat.yellowCards > 0 || stat.redCards > 0);

  const homeGoals = input.homeGoals ?? statRows.filter((stat) => stat.teamId === match.homeTeamId).reduce((sum, stat) => sum + stat.goals, 0);
  const awayGoals = input.awayGoals ?? statRows.filter((stat) => stat.teamId === match.awayTeamId).reduce((sum, stat) => sum + stat.goals, 0);

  match.homeGoals = homeGoals;
  match.awayGoals = awayGoals;
  match.status = "confirmed";
  match.resultLocked = true;
  match.auditTrail.push(input.confirmedByAdmin ? "Resultado modificado con segunda autorización" : "Resultado confirmado");

  await prisma.$transaction([
    prisma.match.update({
      where: { id_match: match.id },
      data: {
        home_goals: homeGoals,
        away_goals: awayGoals,
        status: "confirmed",
        result_locked: true,
        audit_trail: match.auditTrail,
      },
    }),
    prisma.matchStat.deleteMany({ where: { id_match: match.id } }),
    ...(statRows.length > 0
      ? [
          prisma.matchStat.createMany({
            data: statRows.map((stat) => ({
              id_match: match.id,
              id_player: stat.playerId,
              id_team: stat.teamId,
              goals: stat.goals,
              yellow_cards: stat.yellowCards,
              red_cards: stat.redCards,
            })),
          }),
        ]
      : []),
    ...statRows.map((stat) =>
      prisma.playerProfile.upsert({
        where: { id_user: stat.playerId },
        update: { goals: { increment: stat.goals }, matches_played: { increment: 1 } },
        create: { id_user: stat.playerId, visibility: "public", is_available: true, goals: stat.goals, matches_played: 1 },
      }),
    ),
  ]);

  store.matchStats = store.matchStats.filter((stat) => stat.matchId !== match.id).concat(
    statRows.map((stat) => ({
      id: nextId("matchStat"),
      matchId: match.id,
      playerId: stat.playerId,
      teamId: stat.teamId,
      goals: stat.goals,
      yellowCards: stat.yellowCards,
      redCards: stat.redCards,
    })),
  );

  const standings = await recalculateStandings(match.tournamentId);

  if (homeTeam) {
    const captain = findUserById(homeTeam.captainUserId);
    if (captain?.notificationsEnabled) {
      const message = `Resultado actualizado para ${homeTeam.name}.`;
      await prisma.notification.create({ data: { id_user: captain.id, type: "match-result", message } });
      notifyPush(captain.id, message);
    }
  }

  if (awayTeam) {
    const captain = findUserById(awayTeam.captainUserId);
    if (captain?.notificationsEnabled) {
      const message = `Resultado actualizado para ${awayTeam.name}.`;
      await prisma.notification.create({ data: { id_user: captain.id, type: "match-result", message } });
      notifyPush(captain.id, message);
    }
  }

  return {
    ok: true,
    match: clone(match),
    standings: clone(standings),
    notifications: [],
  };
}

export function getTournaments() {
  return clone(store.tournaments.map((tournament) => ({
    ...tournament,
    fixture: store.matches
      .filter((match) => match.tournamentId === tournament.id)
      .map((match) => ({
        ...match,
        stats: store.matchStats.filter((stat) => stat.matchId === match.id),
      })),
    standings: store.standings.filter((standing) => standing.tournamentId === tournament.id),
  })));
}

export function getTournamentSnapshot() {
  return clone({
    tournaments: getTournaments(),
    matches: store.matches,
    standings: store.standings,
  });
}

export function getPlayerProfile(userId: number) {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  const profile = ensureProfile(userId);
  return clone({
    user: {
      id: user.id,
      fullName: user.fullName,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      notificationsEnabled: user.notificationsEnabled,
    },
    profile,
    tournaments: store.tournaments.filter((tournament) => tournament.teamIds.some((teamId) => store.teams.some((team) => team.id === teamId && team.playerIds.includes(userId)))).map((tournament) => tournament.name),
    courts: profile.courts,
    standings: store.standings.filter((standing) => store.tournaments.some((tournament) => tournament.id === standing.tournamentId && tournament.teamIds.some((teamId) => store.teams.some((team) => team.id === teamId && team.playerIds.includes(userId))))),
  });
}

export function updateNickname(userId: number, nickname: string | null) {
  const user = findUserById(userId);
  if (!user) {
    return { ok: false, error: "No encontramos el usuario" } as const;
  }

  user.nickname = nickname?.trim() || null;
  return { ok: true as const, user: clone(user) };
}

export function updateProfileVisibility(input: { userId: number; visibility: "public" | "private" }) {
  const profile = store.playerProfiles.find((item) => item.userId === input.userId);
  if (!profile) {
    return { ok: false, error: "No encontramos el perfil" } as const;
  }

  profile.visibility = input.visibility;
  return { ok: true as const, profile: clone(profile) };
}

export async function createTeam(input: {
  tenantId: number;
  name: string;
  captainUserId: number;
}) : Promise<TeamResult> {
  const captain = findUserById(input.captainUserId);
  if (!captain) {
    return { ok: false, error: "No pudimos identificar al usuario" };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "El nombre del equipo es obligatorio" };
  }

  const normalizedName = name.toLowerCase();
  if (store.teams.some((team) => team.tenantId === input.tenantId && team.name.toLowerCase() === normalizedName)) {
    return { ok: false, error: "Ya existe un equipo con ese nombre" };
  }

  const captainProfile = await ensurePlayerProfile(input.captainUserId);
  const dbTeam = await prisma.team.create({
    data: {
      id_tenant: input.tenantId,
      id_user: input.captainUserId,
      name,
      // El creador queda automáticamente como capitán y primer jugador de la plantilla.
      team_players: { create: [{ id_player: captainProfile.id_player }] },
    },
  });

  const team: TeamRecord = {
    id: dbTeam.id_team,
    tenantId: dbTeam.id_tenant,
    name: dbTeam.name,
    captainUserId: dbTeam.id_user,
    playerIds: [input.captainUserId],
  };

  store.teams.push(team);
  return { ok: true, team: clone(team) };
}

export async function updateTeamRoster(input: {
  teamId: number;
  action: "add" | "remove";
  playerId: number;
}) : Promise<TeamRosterUpdate> {
  const team = store.teams.find((item) => item.id === input.teamId) ?? null;
  const player = findUserById(input.playerId);

  if (!team || !player) {
    return { ok: false, error: "No encontramos el equipo o el jugador" };
  }

  if (input.action === "add" && !team.playerIds.includes(player.id)) {
    const profile = await ensurePlayerProfile(player.id);
    await prisma.teamPlayer.upsert({
      where: { id_team_id_player: { id_team: team.id, id_player: profile.id_player } },
      update: { is_active: true },
      create: { id_team: team.id, id_player: profile.id_player, is_active: true },
    });
    team.playerIds.push(player.id);
  }

  if (input.action === "remove") {
    const profile = await prisma.playerProfile.findUnique({ where: { id_user: player.id } });
    if (profile) {
      await prisma.teamPlayer.deleteMany({ where: { id_team: team.id, id_player: profile.id_player } });
    }
    team.playerIds = team.playerIds.filter((playerId) => playerId !== player.id);
  }

  return { ok: true, team: clone(team), notifications: [] };
}

export async function sendConvocation(input: {
  teamId: number;
  senderUserId: number;
  scheduledAt: string;
  courtName: string;
}) : Promise<ConvocationResult> {
  const team = store.teams.find((item) => item.id === input.teamId) ?? null;
  if (!team) {
    return { ok: false, error: "No encontramos el equipo" };
  }

  if (team.captainUserId !== input.senderUserId) {
    return { ok: false, error: "Solo el capitán del equipo puede enviar convocatorias" };
  }

  const message = `Convocatoria para ${team.name}: ${input.scheduledAt} en ${input.courtName}.`;
  await Promise.all(
    team.playerIds.map(async (playerId) => {
      const player = findUserById(playerId);
      if (!player || !player.notificationsEnabled) return;
      await prisma.notification.create({ data: { id_user: playerId, type: "convocation", message } });
      notifyPush(playerId, message);
    }),
  );

  return { ok: true, notifications: [] };
}

export function listNotifications(userId: number) {
  expireStaleReservations();
  return clone(store.notifications.filter((notification) => notification.userId === userId));
}

export function toggleNotifications(userId: number, enabled: boolean) {
  const user = findUserById(userId);
  if (!user) {
    return { ok: false, error: "No encontramos el usuario" } as const;
  }

  user.notificationsEnabled = enabled;
  return { ok: true as const, user: clone(user) };
}
