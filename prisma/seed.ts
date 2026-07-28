import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding FieldSync database...");

  const rolesData = [
    { name: "admin_plataforma", label: "Administrador de plataforma" },
    { name: "tenant", label: "Tenant (Dueño de cancha)" },
    { name: "jugador", label: "Jugador" },
  ];
  const roles: Record<string, Awaited<ReturnType<typeof prisma.role.upsert>>> = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label },
      create: { name: r.name, label: r.label },
    });
  }
  console.log(`Roles creados: ${Object.keys(roles).length}`);

  const hashedPlataforma = await bcrypt.hash("Plataforma1234!", 10);
  const hashedTenant = await bcrypt.hash("Tenant1234!", 10);
  const hashedCapitan = await bcrypt.hash("Capitan1234!", 10);
  const hashedJugador = await bcrypt.hash("Jugador1234!", 10);

  // Administrador de plataforma: no pertenece a ningún tenant, verifica canchas nuevas (HU-11)
  const plataforma = await prisma.user.upsert({
    where: { email: "plataforma@fieldsync.test" },
    update: {},
    create: {
      full_name: "Admin Plataforma",
      email: "plataforma@fieldsync.test",
      password: hashedPlataforma,
      id_role: roles.admin_plataforma.id_role,
      notifications_enabled: true,
    },
  });
  console.log(`Administrador de plataforma: ${plataforma.email}`);


  const tenantOwner = await prisma.user.upsert({
    where: { email: "tenant@fieldsync.test" },
    update: {},
    create: {
      full_name: "Dueño Cancha Demo",
      email: "tenant@fieldsync.test",
      password: hashedTenant,
      id_role: roles.tenant.id_role,
      status: "verificado",
      id_verifier: plataforma.id_user,
      verified_at: new Date("2026-05-01T12:00:00.000Z"),
      notifications_enabled: true,
    },
  });
  console.log(`Tenant: ${tenantOwner.email}`);

  const capitan = await prisma.user.upsert({
    where: { email: "capitan@fieldsync.test" },
    update: {},
    create: {
      full_name: "Capitan Deportivo",
      email: "capitan@fieldsync.test",
      password: hashedCapitan,
      id_role: roles.jugador.id_role,
      notifications_enabled: true,
    },
  });
  console.log(`Jugador (capitán): ${capitan.email}`);

  const jugador = await prisma.user.upsert({
    where: { email: "jugador@fieldsync.test" },
    update: {},
    create: {
      full_name: "Jugador Demo",
      email: "jugador@fieldsync.test",
      password: hashedJugador,
      id_role: roles.jugador.id_role,
      notifications_enabled: true,
    },
  });
  console.log(`Jugador: ${jugador.email}`);

  // Solo los usuarios con rol "jugador" mantienen Perfil Global (HU-06)
  const profiles = [
    { id_user: capitan.id_user, goals: 3, assists: 5, matches_played: 6 },
    { id_user: jugador.id_user, goals: 4, assists: 2, matches_played: 5 },
  ];
  for (const p of profiles) {
    await prisma.playerProfile.upsert({
      where: { id_user: p.id_user },
      update: {},
      create: {
        id_user: p.id_user,
        visibility: "public",
        is_available: true,
        goals: p.goals,
        assists: p.assists,
        matches_played: p.matches_played,
      },
    });
  }
  console.log("Player profiles creados");

  const courtsData = [
    {
      name: "Complejo Norte - Cancha A",
      address: "Av. Central 1420",
      surface: "synthetic",
      capacity: "5 vs 5",
      price_per_hour: 55,
      rating: 4.8,
    },
    {
      name: "Estadio Barrial - Cancha 2",
      address: "Calle 25 #430",
      surface: "natural",
      capacity: "7 vs 7",
      price_per_hour: 68,
      rating: 4.6,
    },
    {
      name: "Arena Indoor Center",
      address: "Boulevard Sur 990",
      surface: "indoor",
      capacity: "6 vs 6",
      price_per_hour: 72,
      rating: 4.9,
    },
    {
      name: "Canchas del Lago - C",
      address: "Ruta 3 km 5",
      surface: "synthetic",
      capacity: "8 vs 8",
      price_per_hour: 64,
      rating: 4.5,
    },
  ];

  const courts = [];
  for (let i = 0; i < courtsData.length; i++) {
    const c = courtsData[i];
    const createdCourt = await prisma.court.upsert({
      where: { id_court: i + 1 },
      update: {},
      create: {
        id_tenant: tenantOwner.id_user,
        name: c.name,
        address: c.address,
        surface: c.surface,
        capacity: c.capacity,
        price_per_hour: c.price_per_hour,
        rating: c.rating,
        is_active: true,
      },
    });
    courts.push(createdCourt);
  }
  console.log(`Canchas creadas: ${courts.length}`);

  const teamsData = [
    { name: "Tigres del Barrio", captain: capitan, players: [capitan, jugador], logo: "TIG" },
    { name: "Norte FC", captain: capitan, players: [capitan], logo: "NFC" },
    { name: "Arena United", captain: capitan, players: [capitan, jugador], logo: "AUN" },
  ];
  const teams = [];
  for (let i = 0; i < teamsData.length; i += 1) {
    const t = teamsData[i];
    const team = await prisma.team.upsert({
      where: { id_team: i + 1 },
      update: {},
      create: {
        id_tenant: tenantOwner.id_user,
        id_user: t.captain.id_user,
        name: t.name,
        logo_emoji: t.logo,
      },
    });
    teams.push(team);

    for (const player of t.players) {
      const profile = await prisma.playerProfile.findUnique({ where: { id_user: player.id_user } });
      if (profile) {
        await prisma.teamPlayer.upsert({
          where: { id_team_player: (i + 1) * 100 + player.id_user },
          update: {},
          create: {
            id_team: team.id_team,
            id_player: profile.id_player,
            join_date: new Date(),
            is_active: true,
          },
        });
      }
    }
  }
  console.log(`Equipos creados: ${teams.length}`);

  const tournament = await prisma.tournament.upsert({
    where: { id_tournament: 1 },
    update: {},
    create: {
      id_tenant: tenantOwner.id_user,
      name: "Torneo Apertura 2026",
      min_teams: 3,
      start_date: new Date("2026-07-25"),
      end_date: new Date("2026-08-15"),
      start_time: new Date("2026-07-25T19:00:00.000Z"),
      end_time: new Date("2026-08-15T22:00:00.000Z"),
      // Solicitud ya revisada y aprobada por el tenant en el ambiente demo
      status: "aprobado",
      id_approved_by: tenantOwner.id_user,
      approved_at: new Date("2026-07-20T12:00:00.000Z"),
    },
  });
  console.log(`Torneo creado: ${tournament.name} (${tournament.status})`);

  for (let i = 0; i < teams.length; i += 1) {
    await prisma.teamTournament.upsert({
      where: { id_team_tournament: i + 1 },
      update: {},
      create: {
        id_team: teams[i].id_team,
        id_tournament: tournament.id_tournament,
        registration_date: new Date(),
      },
    });
  }
  console.log("Equipos inscritos en el torneo");

  const matchesData = [
    { homeIdx: 0, awayIdx: 1, date: new Date("2026-07-28T19:00:00.000Z"), home: 2, away: 1, confirmed: true },
    { homeIdx: 1, awayIdx: 2, date: new Date("2026-07-30T19:00:00.000Z"), home: null, away: null, confirmed: false },
    { homeIdx: 2, awayIdx: 0, date: new Date("2026-08-02T19:00:00.000Z"), home: null, away: null, confirmed: false },
  ];
  const playerProfile = await prisma.playerProfile.findUnique({ where: { id_user: jugador.id_user } });
  for (let i = 0; i < matchesData.length; i += 1) {
    const m = matchesData[i];
    await prisma.match.upsert({
      where: { id_match: i + 1 },
      update: {},
      create: {
        id_tournament: tournament.id_tournament,
        id_court: courts[0].id_court,
        id_home_team: teams[m.homeIdx].id_team,
        id_away_team: teams[m.awayIdx].id_team,
        id_player: playerProfile?.id_player ?? 1,
        scheduled_at: m.date,
        home_goals: m.home ?? 0,
        away_goals: m.away ?? 0,
        status: m.confirmed ? "confirmed" : "scheduled",
      },
    });
  }
  console.log(`Partidos creados: ${matchesData.length}`);

  const standingsData = [
    { teamIdx: 0, played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, points: 3 },
    { teamIdx: 1, played: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 2, points: 0 },
    { teamIdx: 2, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  ];
  for (let i = 0; i < standingsData.length; i += 1) {
    const s = standingsData[i];
    await prisma.standing.upsert({
      where: { id_standing: i + 1 },
      update: {},
      create: {
        id_tournament: tournament.id_tournament,
        id_team: teams[s.teamIdx].id_team,
        points: s.points,
        matches_played: s.played,
        goal_difference: s.goalsFor - s.goalsAgainst,
        position: s.points === 3 ? 1 : s.teamIdx + 1,
      },
    });
  }
  console.log("Tabla de posiciones inicializada");

  const notificationsData = [
    { user: jugador, type: "reservation", message: "Reserva confirmada para Complejo Norte - Cancha A a las 18:00." },
    { user: jugador, type: "reservation", message: "Reserva confirmada para Arena Indoor Center a las 15:00." },
    { user: capitan, type: "tournament", message: "Fixture disponible para el Torneo Apertura 2026." },
    { user: tenantOwner, type: "tournament", message: "Nueva solicitud de torneo pendiente de aprobación." },
  ];
  for (let i = 0; i < notificationsData.length; i += 1) {
    const n = notificationsData[i];
    await prisma.notification.upsert({
      where: { id_notification: i + 1 },
      update: {},
      create: {
        id_user: n.user.id_user,
        type: n.type,
        message: n.message,
        sent_at: new Date(),
        is_read: false,
      },
    });
  }
  console.log(`Notificaciones creadas: ${notificationsData.length}`);

  console.log("\nSeed completado!");
  console.log("Credenciales de prueba:");
  console.log("  plataforma@fieldsync.test / Plataforma1234!  (admin_plataforma)");
  console.log("  tenant@fieldsync.test     / Tenant1234!       (tenant - dueño de cancha)");
  console.log("  capitan@fieldsync.test    / Capitan1234!      (jugador)");
  console.log("  jugador@fieldsync.test    / Jugador1234!      (jugador)");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
