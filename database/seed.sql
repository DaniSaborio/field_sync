-- ==========================================
-- FIELD SYNC - DATOS DE PRUEBA (DML SEED)
-- ==========================================

-- 1. Roles (3 registros)
INSERT INTO "role" (id_role, name, label) VALUES
  (1, 'admin_plataforma', 'Administrador de plataforma'),
  (2, 'tenant', 'Tenant (Dueño de cancha)'),
  (3, 'jugador', 'Jugador')
ON CONFLICT (id_role) DO UPDATE SET name = EXCLUDED.name, label = EXCLUDED.label;

-- 2. Estados (5 registros)
INSERT INTO "estado" (id_estado, name, label) VALUES
  (1, 'pendiente', 'Pendiente'),
  (2, 'verificado', 'Verificado'),
  (3, 'suspendido', 'Suspendido'),
  (4, 'aprobado', 'Aprobado'),
  (5, 'rechazado', 'Rechazado')
ON CONFLICT (id_estado) DO UPDATE SET name = EXCLUDED.name, label = EXCLUDED.label;

-- 3. Users (7 registros)
INSERT INTO "user" (id_user, full_name, nickname, email, password, id_role, id_estado, id_verifier, verified_at) VALUES
  (1, 'Admin Plataforma', 'Plataforma', 'plataforma@fieldsync.test', '$2a$10$y50e0Yt9wK0yv.m49HmWtObF3.Xv90Kbe35D8TfE/w4y/O42jU7kC', 1, 4, NULL, NULL),
  (2, 'Dueño Cancha Demo', 'TenantDemo', 'tenant@fieldsync.test', '$2a$10$y50e0Yt9wK0yv.m49HmWtObF3.Xv90Kbe35D8TfE/w4y/O42jU7kC', 2, 2, 1, '2026-05-01 12:00:00'),
  (3, 'Capitan Deportivo', 'Capi', 'capitan@fieldsync.test', '$2a$10$y50e0Yt9wK0yv.m49HmWtObF3.Xv90Kbe35D8TfE/w4y/O42jU7kC', 3, 1, NULL, NULL),
  (4, 'Jugador Demo', 'Duki', 'jugador@fieldsync.test', '$2a$10$y50e0Yt9wK0yv.m49HmWtObF3.Xv90Kbe35D8TfE/w4y/O42jU7kC', 3, 1, NULL, NULL),
  (5, 'Carlos Ramirez', 'Carlitos', 'carlos@fieldsync.test', '$2a$10$y50e0Yt9wK0yv.m49HmWtObF3.Xv90Kbe35D8TfE/w4y/O42jU7kC', 3, 1, NULL, NULL),
  (6, 'Mario Gomez', 'Gomez', 'mario@fieldsync.test', '$2a$10$y50e0Yt9wK0yv.m49HmWtObF3.Xv90Kbe35D8TfE/w4y/O42jU7kC', 3, 1, NULL, NULL),
  (7, 'Andres Alvarado', 'Andy', 'andres@fieldsync.test', '$2a$10$y50e0Yt9wK0yv.m49HmWtObF3.Xv90Kbe35D8TfE/w4y/O42jU7kC', 3, 1, NULL, NULL)
ON CONFLICT (id_user) DO UPDATE SET full_name = EXCLUDED.full_name, nickname = EXCLUDED.nickname, email = EXCLUDED.email;

-- 4. Player Profiles (5 registros para los jugadores)
INSERT INTO "player_profile" (id_player, id_user, visibility, is_available, goals, assists, matches_played) VALUES
  (1, 3, 'public', TRUE, 3, 5, 6),
  (2, 4, 'public', TRUE, 4, 2, 5),
  (3, 5, 'public', TRUE, 1, 0, 2),
  (4, 6, 'private', TRUE, 0, 1, 3),
  (5, 7, 'public', FALSE, 2, 2, 4)
ON CONFLICT (id_player) DO UPDATE SET goals = EXCLUDED.goals, assists = EXCLUDED.assists;

-- 5. Courts (5 registros)
INSERT INTO "court" (id_court, id_tenant, name, is_active, has_light, address, maps_url, surface, capacity, price_per_hour, rating) VALUES
  (1, 2, 'Complejo Norte - Cancha A', TRUE, TRUE, 'Av. Central 1420', 'https://maps.google.com/?q=Complejo+Norte', 'synthetic', '5 vs 5', 55.00, 4.80),
  (2, 2, 'Estadio Barrial - Cancha 2', TRUE, FALSE, 'Calle 25 #430', 'https://maps.google.com/?q=Estadio+Barrial', 'natural', '7 vs 7', 68.00, 4.60),
  (3, 2, 'Arena Indoor Center', TRUE, TRUE, 'Boulevard Sur 990', 'https://maps.google.com/?q=Arena+Indoor', 'indoor', '6 vs 6', 72.00, 4.90),
  (4, 2, 'Canchas del Lago - C', TRUE, FALSE, 'Ruta 3 km 5', 'https://maps.google.com/?q=Canchas+Lago', 'synthetic', '8 vs 8', 64.00, 4.50),
  (5, 2, 'Domo Central - 5', TRUE, TRUE, 'Plaza Central Oeste', NULL, 'synthetic', '5 vs 5', 50.00, 4.70)
ON CONFLICT (id_court) DO UPDATE SET name = EXCLUDED.name, price_per_hour = EXCLUDED.price_per_hour;

-- 6. Rates (5 registros)
INSERT INTO "rate" (id_rate, id_tenant, id_court, name, schedule_type, amount, priority) VALUES
  (1, 2, 1, 'Tarifa noche Cancha A', 'night', 65.00, 1),
  (2, 2, 3, 'Tarifa mañana Arena', 'morning', 60.00, 1),
  (3, 2, NULL, 'Tarifa base noche', 'night', 75.00, 1),
  (4, 2, 2, 'Tarifa tarde Cancha 2', 'afternoon', 70.00, 2),
  (5, 2, 5, 'Tarifa noche Domo', 'night', 58.00, 1)
ON CONFLICT (id_rate) DO UPDATE SET amount = EXCLUDED.amount;

-- 7. Teams (5 registros)
INSERT INTO "team" (id_team, id_tenant, id_user, name, logo_emoji) VALUES
  (1, 2, 3, 'Tigres del Barrio', '🐯'),
  (2, 2, 3, 'Norte FC', '⚽'),
  (3, 2, 3, 'Arena United', '🛡️'),
  (4, 2, 4, 'Furia FC', '🔥'),
  (5, 2, 5, 'Depor Norte', '🦅')
ON CONFLICT (id_team) DO UPDATE SET name = EXCLUDED.name;

-- 8. Team Players Relationships
INSERT INTO "team_player" (id_team_player, id_team, id_player, join_date, is_active) VALUES
  (1, 1, 1, '2026-06-01 10:00:00', TRUE),
  (2, 1, 2, '2026-06-01 10:30:00', TRUE),
  (3, 2, 1, '2026-06-02 11:00:00', TRUE),
  (4, 3, 1, '2026-06-03 09:00:00', TRUE),
  (5, 3, 2, '2026-06-03 09:15:00', TRUE)
ON CONFLICT (id_team_player) DO NOTHING;

-- 9. Tournaments (5 registros)
INSERT INTO "tournament" (id_tournament, id_tenant, id_court, name, format, fixture_mode, min_teams, start_date, end_date, start_time, end_time, id_requested_by, id_estado, id_approved_by, approved_at) VALUES
  (1, 2, 1, 'Torneo Apertura 2026', 'todos-contra-todos', 'aleatorio', 3, '2026-07-25', '2026-08-15', '2026-07-25 19:00:00', '2026-08-15 22:00:00', 2, 4, 2, '2026-07-20 12:00:00'),
  (2, 2, 3, 'Copa de Invierno', 'eliminatorio', 'aleatorio', 4, '2026-09-01', '2026-09-30', '2026-09-01 18:00:00', '2026-09-30 21:00:00', 3, 4, 2, '2026-08-01 10:00:00'),
  (3, 2, 2, 'Liga Comercial', 'todos-contra-todos', 'manual', 6, '2026-10-05', '2026-11-20', '2026-10-05 19:00:00', '2026-11-20 22:00:00', 3, 1, NULL, NULL),
  (4, 2, 4, 'Torneo de Veterans', 'todos-contra-todos', 'aleatorio', 8, '2026-10-15', '2026-11-30', '2026-10-15 17:00:00', '2026-11-30 20:00:00', 4, 1, NULL, NULL),
  (5, 2, 5, 'Supercopa Nocturna', 'eliminatorio', 'aleatorio', 4, '2026-12-01', '2026-12-15', '2026-12-01 20:00:00', '2026-12-15 23:00:00', 2, 4, 2, '2026-08-10 14:00:00')
ON CONFLICT (id_tournament) DO UPDATE SET name = EXCLUDED.name;

-- 10. Reservations (5 registros)
INSERT INTO "reservation" (id_reservation, id_court, id_user, id_rate, date, start_time, end_time, status, hold_expires_at, created_at) VALUES
  (1, 1, 4, NULL, '2026-07-30', '2026-07-30 18:00:00', '2026-07-30 19:00:00', 'confirmada', NULL, '2026-07-20 10:00:00'),
  (2, 3, 4, NULL, '2026-07-29', '2026-07-29 15:00:00', '2026-07-29 16:00:00', 'confirmada', NULL, '2026-07-20 11:00:00'),
  (3, 1, 3, 1, '2026-08-28', '2026-08-28 19:00:00', '2026-08-28 20:00:00', 'pendiente', '2026-08-24 16:30:00', '2026-08-24 16:00:00'),
  (4, 2, 5, NULL, '2026-08-29', '2026-08-29 13:00:00', '2026-08-29 14:00:00', 'confirmada', NULL, '2026-08-23 15:00:00'),
  (5, 5, 6, 5, '2026-08-30', '2026-08-30 20:00:00', '2026-08-30 21:00:00', 'pendiente', '2026-08-24 17:00:00', '2026-08-24 16:15:00')
ON CONFLICT (id_reservation) DO UPDATE SET status = EXCLUDED.status;

-- 11. Payments (5 registros)
INSERT INTO "payment" (id_payment, id_reservation, amount, payment_method, payment_date, id_estado, id_verified_by, verified_at) VALUES
  (1, 1, 55.00, 'sinpe', '2026-07-20 10:05:00', 2, 2, '2026-07-20 10:15:00'),
  (2, 2, 72.00, 'efectivo', '2026-07-20 11:05:00', 2, 2, '2026-07-20 11:10:00'),
  (3, 3, 65.00, 'sinpe', '2026-08-24 16:02:00', 1, NULL, NULL),
  (4, 4, 68.00, 'efectivo', '2026-08-23 15:05:00', 2, 2, '2026-08-23 15:15:00'),
  (5, 5, 58.00, 'sinpe', '2026-08-24 16:16:00', 1, NULL, NULL)
ON CONFLICT (id_payment) DO UPDATE SET amount = EXCLUDED.amount, id_estado = EXCLUDED.id_estado;

-- 12. Notifications (5 registros)
INSERT INTO "notification" (id_notification, id_user, type, message, sent_at, is_read) VALUES
  (1, 4, 'reservation', 'Reserva confirmada para Complejo Norte - Cancha A a las 18:00.', '2026-07-20 10:15:00', TRUE),
  (2, 4, 'reservation', 'Reserva confirmada para Arena Indoor Center a las 15:00.', '2026-07-20 11:10:00', FALSE),
  (3, 3, 'tournament', 'Calendario disponible para el Torneo Apertura 2026.', '2026-07-21 09:00:00', FALSE),
  (4, 2, 'payment-pending', 'Verifica el pago por SINPE Móvil de la reserva en Cancha A.', '2026-08-24 16:02:00', FALSE),
  (5, 2, 'tournament', 'Nueva solicitud de torneo Copa de Invierno.', '2026-08-01 10:00:00', TRUE)
ON CONFLICT (id_notification) DO UPDATE SET is_read = EXCLUDED.is_read;
