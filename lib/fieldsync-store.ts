export type UserRole = "administrador" | "recepcionista" | "organizador" | "jugador";

export type CourtSurface = "synthetic" | "natural" | "indoor";
export type TournamentFormat = "eliminatorio" | "todos-contra-todos";
export type MatchStatus = "scheduled" | "confirmed";
export type NotificationType = "reservation" | "cancellation" | "tournament" | "convocation" | "match-result" | "payment-split" | "match-invite" | "payment-pending";

export type UserRecord = {
  id: number;
  fullName: string;
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
  standings: StandingRecord[];
  playerProfiles: PlayerProfileRecord[];
};

export type ReservationFilter = {
  date?: string;
  timeSlot?: string;
  surface?: string;
  userId?: number;
};

export type ReservationResult =
  | {
      ok: true;
      reservation: ReservationRecord;
      notifications: NotificationRecord[];
    }
  | {
      ok: false;
      error: string;
      suggestedSlot?: string | null;
    };

export type PaymentVerificationResult =
  | {
      ok: true;
      reservation: ReservationRecord;
      notifications: NotificationRecord[];
    }
  | {
      ok: false;
      error: string;
    };

export type CancelResult =
  | {
      ok: true;
      reservation: ReservationRecord;
      notifications: NotificationRecord[];
    }
  | {
      ok: false;
      error: string;
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
    standing: 1,
    profile: 4,
  },
  users: [
    {
      id: 1,
      fullName: "Admin FieldSync",
      email: "admin@fieldsync.test",
      password: "Admin1234!",
      role: "administrador",
      tenantId: 1,
      notificationsEnabled: true,
    },
    {
      id: 2,
      fullName: "Recepción Principal",
      email: "recepcion@fieldsync.test",
      password: "Recepcion1234!",
      role: "recepcionista",
      tenantId: 1,
      notificationsEnabled: true,
    },
    {
      id: 3,
      fullName: "Capitán Deportivo",
      email: "capitan@fieldsync.test",
      password: "Capitan1234!",
      role: "organizador",
      tenantId: 1,
      notificationsEnabled: true,
    },
    {
      id: 4,
      fullName: "Jugador Demo",
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
      message: "Fixture disponible para el Torneo Apertura 2026.",
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

function recalculateStandings(tournamentId: number) {
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

  store.standings = store.standings.filter((standing) => standing.tournamentId !== tournamentId).concat(standings);
  return standings;
}

function generateFixture(tournament: TournamentRecord) {
  const teamIds = tournament.teamIds;
  const matches: MatchRecord[] = [];

  if (tournament.format === "todos-contra-todos") {
    for (let homeIndex = 0; homeIndex < teamIds.length; homeIndex += 1) {
      for (let awayIndex = homeIndex + 1; awayIndex < teamIds.length; awayIndex += 1) {
        matches.push({
          id: nextId("match"),
          tournamentId: tournament.id,
          homeTeamId: teamIds[homeIndex],
          awayTeamId: teamIds[awayIndex],
          scheduledAt: new Date(Date.UTC(2026, 6, 28 + matches.length, 19, 0, 0)).toISOString(),
          homeGoals: null,
          awayGoals: null,
          status: "scheduled",
          resultLocked: false,
          auditTrail: [],
        });
      }
    }
  } else {
    for (let index = 0; index < teamIds.length - 1; index += 2) {
      matches.push({
        id: nextId("match"),
        tournamentId: tournament.id,
        homeTeamId: teamIds[index],
        awayTeamId: teamIds[index + 1],
        scheduledAt: new Date(Date.UTC(2026, 6, 28 + matches.length, 19, 0, 0)).toISOString(),
        homeGoals: null,
        awayGoals: null,
        status: "scheduled",
        resultLocked: false,
        auditTrail: [],
      });
    }
  }

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
    role: user.role,
    tenantId: user.tenantId,
    notificationsEnabled: user.notificationsEnabled,
  });
}

export function registerUser(input: {
  fullName: string;
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
      role: user.role,
      tenantId: user.tenantId,
      notificationsEnabled: user.notificationsEnabled,
    }),
  };
}

export function listCourts(filters: ReservationFilter = {}) {
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
      availableSlots: slots,
      reservations: store.reservations.filter((reservation) => reservation.courtId === court.id && reservation.status !== "cancelada" && (!date || reservation.date === date) && (!userId || reservation.userId === userId)).map(clone),
    };
  }).filter((court) => court.availableSlots.length > 0 || court.reservations.length > 0);

  return clone(visibleCourts);
}

export function getReservations(userId?: number) {
  const reservations = store.reservations.filter((reservation) => (userId ? reservation.userId === userId : true));
  return clone(reservations);
}

export function notifyTeamMembers(input: {
  teamId: number;
  excludeUserId?: number;
  type: NotificationType;
  message: (member: UserRecord) => string;
}) {
  const team = store.teams.find((item) => item.id === input.teamId);
  if (!team) return [] as NotificationRecord[];

  return team.playerIds
    .filter((playerId) => playerId !== input.excludeUserId)
    .flatMap((playerId) => {
      const member = findUserById(playerId);
      if (!member || !member.notificationsEnabled) return [] as NotificationRecord[];
      return [createNotification(playerId, input.type, input.message(member))];
    });
}

export function notifyTeamCaptain(input: {
  teamId: number;
  type: NotificationType;
  message: string;
}) {
  const team = store.teams.find((item) => item.id === input.teamId);
  if (!team) return null;
  const captain = findUserById(team.captainUserId);
  if (!captain || !captain.notificationsEnabled) return null;
  return createNotification(team.captainUserId, input.type, input.message);
}

export function getTeamById(teamId: number) {
  const team = store.teams.find((item) => item.id === teamId);
  return team ? clone(team) : null;
}

const HOLD_DURATION_MS = 30 * 60 * 1000;

function notifyCourtOwner(court: CourtRecord, type: NotificationType, message: string) {
  const owner = store.users.find((candidate) => candidate.tenantId === court.tenantId && candidate.role === "administrador");
  if (!owner || !owner.notificationsEnabled) return null;
  return createNotification(owner.id, type, message);
}

export function reserveCourt(input: {
  userId: number;
  courtId: number;
  date: string;
  timeSlot: string;
  paymentMethod: PaymentMethod | null;
  teamId?: number | null;
  splitPayment?: boolean;
  rivalTeamId?: number | null;
}) : ReservationResult {
  const user = findUserById(input.userId);
  const court = store.courts.find((item) => item.id === input.courtId) ?? null;

  if (!user || !court) {
    return { ok: false, error: "No pudimos identificar el usuario o la cancha" };
  }

  if (!input.paymentMethod) {
    return { ok: false, error: "Selecciona un método de pago (SINPE o efectivo)" };
  }

  const conflict = store.reservations.find((reservation) => reservation.courtId === input.courtId && reservation.date === input.date && reservation.timeSlot === input.timeSlot && isSlotActive(reservation));
  if (conflict) {
    const availableLater = court.availableSlots.find((slot) => {
      const reserved = store.reservations.some((reservation) => reservation.courtId === input.courtId && reservation.date === input.date && reservation.timeSlot === slot && isSlotActive(reservation));
      return !reserved && slot > input.timeSlot;
    });

    return {
      ok: false,
      error: "Franja no disponible",
      suggestedSlot: availableLater ?? null,
    };
  }

  const paymentLabel = input.paymentMethod === "sinpe" ? "SINPE Móvil" : "efectivo";
  const reservation: ReservationRecord = {
    id: nextId("reservation"),
    userId: input.userId,
    courtId: input.courtId,
    date: input.date,
    timeSlot: input.timeSlot,
    status: "pendiente",
    createdAt: new Date().toISOString(),
    holdExpiresAt: new Date(Date.now() + HOLD_DURATION_MS).toISOString(),
    paymentMethod: input.paymentMethod,
    paymentStatus: "pendiente",
    rejectionReason: null,
    amount: court.pricePerHour,
  };

  store.reservations.push(reservation);
  const notifications = user.notificationsEnabled
    ? [createNotification(input.userId, "reservation", `Reserva en ${court.name} a las ${input.timeSlot} pendiente de confirmación de pago (${paymentLabel}) por el dueño de la cancha.`)]
    : [];

  const ownerNotification = notifyCourtOwner(
    court,
    "payment-pending",
    `Nueva reserva en ${court.name} el ${input.date} a las ${input.timeSlot}. Verifica el pago por ${paymentLabel} (₡${court.pricePerHour}) para confirmarla.`,
  );
  if (ownerNotification) {
    notifications.push(ownerNotification);
  }

  if (input.teamId && input.splitPayment) {
    const team = store.teams.find((item) => item.id === input.teamId);
    if (team) {
      const perPerson = (court.pricePerHour / team.playerIds.length).toFixed(2);
      notifications.push(
        ...notifyTeamMembers({
          teamId: input.teamId,
          excludeUserId: input.userId,
          type: "payment-split",
          message: () =>
            `${user.fullName} reservó ${court.name} el ${input.date} a las ${input.timeSlot}. Tu parte del pago: $${perPerson}.`,
        }),
      );
    }
  }

  if (input.rivalTeamId) {
    const notification = notifyTeamCaptain({
      teamId: input.rivalTeamId,
      type: "match-invite",
      message: `${user.fullName} te invita a jugar en ${court.name} el ${input.date} a las ${input.timeSlot}.`,
    });
    if (notification) {
      notifications.push(notification);
    }
  }

  const profile = ensureProfile(input.userId);
  if (!profile.courts.includes(court.name)) {
    profile.courts.push(court.name);
  }

  return { ok: true, reservation: clone(reservation), notifications: clone(notifications) };
}

export function cancelReservation(input: {
  reservationId: number;
  userId: number;
  now?: Date;
}) : CancelResult {
  const reservation = store.reservations.find((item) => item.id === input.reservationId) ?? null;
  const user = findUserById(input.userId);

  if (!reservation || !user || reservation.userId !== input.userId) {
    return { ok: false, error: "No encontramos la reserva solicitada" };
  }

  const reservationDateTime = formatDateTime(reservation.date, reservation.timeSlot);
  const now = input.now ?? new Date();
  const hoursDifference = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDifference < 24) {
    return { ok: false, error: "No es posible cancelar con menos de 24 horas de anticipación" };
  }

  reservation.status = "cancelada";
  const court = store.courts.find((item) => item.id === reservation.courtId);
  const notifications = user.notificationsEnabled && court
    ? [createNotification(input.userId, "cancellation", `Cancelamos tu reserva en ${court.name} para ${reservation.date} ${reservation.timeSlot}.`)]
    : [];

  return { ok: true, reservation: clone(reservation), notifications: clone(notifications) };
}

// El dueño de la cancha (administrador del tenant) confirma o rechaza el pago
// declarado por el jugador. Solo entonces la reserva sale de "pendiente".
export function verifyPayment(input: {
  reservationId: number;
  tenantId: number;
  action: "confirm" | "reject";
  reason?: string | null;
}) : PaymentVerificationResult {
  const reservation = store.reservations.find((item) => item.id === input.reservationId) ?? null;
  const court = reservation ? store.courts.find((item) => item.id === reservation.courtId) : null;

  if (!reservation || !court) {
    return { ok: false, error: "No encontramos la reserva" };
  }

  if (court.tenantId !== input.tenantId) {
    return { ok: false, error: "Esta reserva no pertenece a una de tus canchas" };
  }

  if (reservation.status !== "pendiente") {
    return { ok: false, error: "Esta reserva ya fue procesada" };
  }

  if (input.action === "reject" && !input.reason) {
    return { ok: false, error: "Indica el motivo del rechazo" };
  }

  reservation.status = input.action === "confirm" ? "confirmada" : "rechazada";
  reservation.paymentStatus = input.action === "confirm" ? "verificado" : "rechazado";
  reservation.rejectionReason = input.action === "reject" ? input.reason ?? null : null;
  reservation.holdExpiresAt = null;

  const user = findUserById(reservation.userId);
  const notifications = user?.notificationsEnabled
    ? [
        createNotification(
          reservation.userId,
          input.action === "confirm" ? "reservation" : "cancellation",
          input.action === "confirm"
            ? `¡Pago verificado! Tu reserva en ${court.name} el ${reservation.date} a las ${reservation.timeSlot} quedó confirmada.`
            : `Tu reserva en ${court.name} el ${reservation.date} a las ${reservation.timeSlot} fue rechazada: ${input.reason}.`,
        ),
      ]
    : [];

  return { ok: true, reservation: clone(reservation), notifications: clone(notifications) };
}

export function listUsers() {
  return clone(store.users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
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
      return user ? { id: user.id, fullName: user.fullName, email: user.email } : null;
    }).filter(Boolean),
  })));
}

const TOURNAMENT_CREATOR_ROLES = ["administrador", "admin_plataforma", "tenant"];

export function createTournament(input: {
  tenantId: number;
  createdByUserId: number;
  creatorRole?: string;
  courtId: number;
  name: string;
  format: TournamentFormat;
  teamIds: number[];
  startDate: string;
  endDate: string;
}) : TournamentResult {
  if (!input.name.trim()) {
    return { ok: false, error: "El nombre del torneo es obligatorio" };
  }

  // El sistema de torneos vive en este store en memoria, separado de los usuarios
  // reales en Postgres, así que el rol se toma tal cual lo declara el cliente
  // (mismo nivel de confianza que el resto de la API en este prototipo).
  if (!input.creatorRole || !TOURNAMENT_CREATOR_ROLES.includes(input.creatorRole)) {
    return { ok: false, error: "Solo un administrador o el dueño de la cancha pueden crear torneos" };
  }

  if (!store.courts.some((court) => court.id === input.courtId)) {
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

  const tournament: TournamentRecord = {
    id: nextId("tournament"),
    tenantId: input.tenantId,
    createdByUserId: input.createdByUserId,
    courtId: input.courtId,
    name: input.name.trim(),
    format: input.format,
    teamsRequired: teamIds.length,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "draft",
    requestStatus: "aprobado",
    rejectionReason: null,
    teamIds,
    fixture: [],
  };

  store.tournaments.push(tournament);

  return { ok: true, tournament: clone(tournament), notifications: [] };
}

export function enrollTeamToTournament(input: {
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
    tournament.teamIds.push(team.id);
  }

  return { ok: true as const, tournament: clone(tournament) };
}

export function startTournament(input: {
  tournamentId: number;
}) : TournamentResult {
  const tournament = store.tournaments.find((item) => item.id === input.tournamentId) ?? null;
  if (!tournament) {
    return { ok: false, error: "No encontramos el torneo" };
  }

  if (tournament.requestStatus !== "aprobado") {
    return { ok: false, error: "El torneo aún no ha sido aprobado por el dueño de la cancha" };
  }

  if (tournament.teamIds.length < tournament.teamsRequired) {
    return { ok: false, error: "Aún no se completa el número mínimo de equipos" };
  }

  tournament.status = "active";
  const fixture = generateFixture(tournament);
  const notifications = store.teams
    .filter((team) => tournament.teamIds.includes(team.id))
    .flatMap((team) => {
      const captain = findUserById(team.captainUserId);
      if (!captain || !captain.notificationsEnabled) {
        return [] as NotificationRecord[];
      }

      return [createNotification(captain.id, "tournament", `El torneo ${tournament.name} ya tiene fixture generado.`)];
    });

  return { ok: true, tournament: clone({ ...tournament, fixture }), notifications: clone(notifications) };
}

export function recordMatchResult(input: {
  matchId: number;
  homeGoals: number;
  awayGoals: number;
  confirmedByAdmin?: boolean;
}) : MatchResultUpdate {
  const match = store.matches.find((item) => item.id === input.matchId) ?? null;
  if (!match) {
    return { ok: false, error: "No encontramos el partido" };
  }

  if (match.resultLocked && !input.confirmedByAdmin) {
    match.auditTrail.push("Intento de modificación rechazado: se requiere segunda autorización.");
    return {
      ok: false,
      error: "Se requiere una segunda autorización para modificar un resultado confirmado",
      requiresSecondAuthorization: true,
      auditTrail: clone(match.auditTrail),
    };
  }

  match.homeGoals = input.homeGoals;
  match.awayGoals = input.awayGoals;
  match.status = "confirmed";
  match.resultLocked = true;
  match.auditTrail.push(input.confirmedByAdmin ? "Resultado modificado con segunda autorización" : "Resultado confirmado");

  const standings = recalculateStandings(match.tournamentId);
  const homeTeam = store.teams.find((team) => team.id === match.homeTeamId);
  const awayTeam = store.teams.find((team) => team.id === match.awayTeamId);
  const notifications: NotificationRecord[] = [];

  if (homeTeam) {
    const captain = findUserById(homeTeam.captainUserId);
    if (captain?.notificationsEnabled) {
      notifications.push(createNotification(captain.id, "match-result", `Resultado actualizado para ${homeTeam.name}.`));
    }
  }

  if (awayTeam) {
    const captain = findUserById(awayTeam.captainUserId);
    if (captain?.notificationsEnabled) {
      notifications.push(createNotification(captain.id, "match-result", `Resultado actualizado para ${awayTeam.name}.`));
    }
  }

  const homeProfile = store.playerProfiles.find((profile) => profile.userId === homeTeam?.captainUserId);
  const awayProfile = store.playerProfiles.find((profile) => profile.userId === awayTeam?.captainUserId);
  if (homeProfile) {
    homeProfile.matchesPlayed += 1;
    homeProfile.goals += input.homeGoals;
    homeProfile.assists += input.homeGoals > 0 ? 1 : 0;
  }

  if (awayProfile) {
    awayProfile.matchesPlayed += 1;
    awayProfile.goals += input.awayGoals;
    awayProfile.assists += input.awayGoals > 0 ? 1 : 0;
  }

  return {
    ok: true,
    match: clone(match),
    standings: clone(standings),
    notifications: clone(notifications),
  };
}

export function getTournaments() {
  return clone(store.tournaments.map((tournament) => ({
    ...tournament,
    fixture: store.matches.filter((match) => match.tournamentId === tournament.id),
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

export function updateProfileVisibility(input: { userId: number; visibility: "public" | "private" }) {
  const profile = store.playerProfiles.find((item) => item.userId === input.userId);
  if (!profile) {
    return { ok: false, error: "No encontramos el perfil" } as const;
  }

  profile.visibility = input.visibility;
  return { ok: true as const, profile: clone(profile) };
}

export function createTeam(input: {
  tenantId: number;
  name: string;
  captainUserId: number;
}) : TeamResult {
  const captain = findUserById(input.captainUserId);
  if (!captain) {
    return { ok: false, error: "No pudimos identificar al usuario" };
  }

  if (!input.name.trim()) {
    return { ok: false, error: "El nombre del equipo es obligatorio" };
  }

  const normalizedName = input.name.trim().toLowerCase();
  if (store.teams.some((team) => team.tenantId === input.tenantId && team.name.toLowerCase() === normalizedName)) {
    return { ok: false, error: "Ya existe un equipo con ese nombre" };
  }

  const team: TeamRecord = {
    id: nextId("team"),
    tenantId: input.tenantId,
    name: input.name.trim(),
    captainUserId: input.captainUserId,
    // El creador queda automáticamente como capitán y primer jugador de la plantilla.
    playerIds: [input.captainUserId],
  };

  store.teams.push(team);
  return { ok: true, team: clone(team) };
}

export function updateTeamRoster(input: {
  teamId: number;
  action: "add" | "remove";
  playerId: number;
}) : TeamRosterUpdate {
  const team = store.teams.find((item) => item.id === input.teamId) ?? null;
  const player = findUserById(input.playerId);

  if (!team || !player) {
    return { ok: false, error: "No encontramos el equipo o el jugador" };
  }

  if (input.action === "add" && !team.playerIds.includes(player.id)) {
    team.playerIds.push(player.id);
  }

  if (input.action === "remove") {
    team.playerIds = team.playerIds.filter((playerId) => playerId !== player.id);
  }

  return { ok: true, team: clone(team), notifications: [] };
}

export function sendConvocation(input: {
  teamId: number;
  senderUserId: number;
  scheduledAt: string;
  courtName: string;
}) : ConvocationResult {
  const team = store.teams.find((item) => item.id === input.teamId) ?? null;
  if (!team) {
    return { ok: false, error: "No encontramos el equipo" };
  }

  if (team.captainUserId !== input.senderUserId) {
    return { ok: false, error: "Solo el capitán del equipo puede enviar convocatorias" };
  }

  const notifications = team.playerIds.flatMap((playerId) => {
    const player = findUserById(playerId);
    if (!player || !player.notificationsEnabled) {
      return [] as NotificationRecord[];
    }

    return [createNotification(player.id, "convocation", `Convocatoria para ${team.name}: ${input.scheduledAt} en ${input.courtName}.`)];
  });

  return { ok: true, notifications: clone(notifications) };
}

export function listNotifications(userId: number) {
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
