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
  // pendiente | verificado | suspendido — solo relevante para rol "tenant" (HU-11).
  status?: string;
};

export type PaymentMethod = "sinpe" | "efectivo" | "mixto";
export type PaymentStatus = "pendiente" | "verificado" | "rechazado";

export type CourtReservation = {
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
  playerName?: string | null;
  playerEmail?: string | null;
  teamId?: number | null;
  rivalTeamId?: number | null;
  matchClosed?: boolean | null;
};

export type CourtCard = {
  id: number;
  tenantId: number;
  name: string;
  location: string;
  mapsUrl?: string | null;
  surface: "synthetic" | "natural" | "indoor";
  hasLights: boolean;
  capacity: string;
  pricePerHour: number;
  pricePerHourNight: number | null;
  rates: { morning: number | null; afternoon: number | null; night: number | null };
  rating: number;
  availableSlots: string[];
  reservations: CourtReservation[];
};

export type MatchStat = {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  goals: number;
  yellowCards: number;
  redCards: number;
};

export type TournamentMatch = {
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
  round: number;
  stats: MatchStat[];
};

export type Standing = {
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

export type TournamentCard = {
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

export type TeamCard = {
  id: number;
  name: string;
  captainUserId: number;
  playerIds: number[];
  players: Array<{ id: number; fullName: string; nickname?: string | null; email: string } | null>;
};

export type UserOption = {
  id: number;
  fullName: string;
  nickname?: string | null;
  email: string;
  role: string;
};

export type AdminUserRow = {
  id: number;
  fullName: string;
  nickname: string | null;
  email: string;
  role: string;
  roleLabel: string;
  status: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

export type AdminCourtRow = {
  id: number;
  name: string;
  address: string | null;
  surface: string | null;
  pricePerHour: number | null;
  hasLights: boolean;
  isActive: boolean;
  tenantId: number;
  tenantName: string;
  tenantEmail: string;
};

export type TenantRequestAdminRow = {
  id: number;
  userId: number;
  userEmail: string;
  complexName: string;
  phone: string;
  address: string;
  mapsUrl: string;
  courtName: string;
  surface: string;
  capacity: string;
  price: string;
  hasLights: boolean;
  status: "pendiente" | "aprobado" | "rechazado";
  reviewerName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileSnapshot = {
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

export type OwnedCourtSummary = {
  id: number;
  name: string;
  address: string | null;
  pricePerHour: number | null;
  rating: number | null;
  pendingCount: number;
  confirmedCount: number;
  verifiedRevenue: number;
};

export type TenantProfileSnapshot = {
  kind: "tenant";
  user: { id: number; fullName: string; nickname?: string | null; email: string; role: string; notificationsEnabled: boolean };
  courts: OwnedCourtSummary[];
};

export type AnyProfileSnapshot = ProfileSnapshot | TenantProfileSnapshot;

export type ApiResponse<T> = {
  ok?: boolean;
  error?: string;
} & T;

export type NotificationCard = {
  id: number;
  userId: number;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
};
