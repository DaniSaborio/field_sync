-- ==========================================
-- FIELD SYNC - BASE DE DATOS POSTGRESQL (DDL)
-- ==========================================

-- ENUMS
CREATE TYPE "EstadoEntidad" AS ENUM ('tenant', 'tournament', 'payment');

-- 1. Catálogos Base
CREATE TABLE IF NOT EXISTS "role" (
    id_role SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS "estado" (
    id_estado SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,
    label VARCHAR(60) NOT NULL
);

-- 2. Auditoría e Historial de Estados
CREATE TABLE IF NOT EXISTS "estado_historial" (
    id_historial SERIAL PRIMARY KEY,
    entidad "EstadoEntidad" NOT NULL,
    id_entidad INTEGER NOT NULL,
    id_estado_previo INTEGER REFERENCES "estado"(id_estado) ON DELETE SET NULL ON UPDATE CASCADE,
    id_estado_nuevo INTEGER NOT NULL REFERENCES "estado"(id_estado) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_changed_by INTEGER,
    reason VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS "user" (
    id_user SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    nickname VARCHAR(50),
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    provider VARCHAR(30) DEFAULT 'credentials' NOT NULL,
    provider_id VARCHAR(255),
    id_role INTEGER NOT NULL REFERENCES "role"(id_role) ON DELETE RESTRICT ON UPDATE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_estado INTEGER NOT NULL REFERENCES "estado"(id_estado) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_verifier INTEGER REFERENCES "user"(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    verified_at TIMESTAMP
);

-- 4. Canchas y Tarifas
CREATE TABLE IF NOT EXISTS "court" (
    id_court SERIAL PRIMARY KEY,
    id_tenant INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    has_light BOOLEAN DEFAULT FALSE NOT NULL,
    address VARCHAR(255),
    maps_url VARCHAR(500),
    surface VARCHAR(20),
    capacity VARCHAR(20),
    price_per_hour DECIMAL(10, 2),
    rating DECIMAL(3, 2)
);

CREATE TABLE IF NOT EXISTS "rate" (
    id_rate SERIAL PRIMARY KEY,
    id_tenant INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_court INTEGER REFERENCES "court"(id_court) ON DELETE SET NULL ON UPDATE CASCADE,
    name VARCHAR(100) NOT NULL,
    schedule_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    priority INTEGER DEFAULT 1 NOT NULL
);

-- 5. Reservas, Pagos y Checklist
CREATE TABLE IF NOT EXISTS "reservation" (
    id_reservation SERIAL PRIMARY KEY,
    id_court INTEGER NOT NULL REFERENCES "court"(id_court) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_user INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_rate INTEGER REFERENCES "rate"(id_rate) ON DELETE SET NULL ON UPDATE CASCADE,
    date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'pendiente' NOT NULL,
    hold_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_team INTEGER,
    id_rival_team INTEGER,
    match_closed_at TIMESTAMP,
    id_match_closed_by INTEGER REFERENCES "user"(id_user) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "payment" (
    id_payment SERIAL PRIMARY KEY,
    id_reservation INTEGER UNIQUE NOT NULL REFERENCES "reservation"(id_reservation) ON DELETE RESTRICT ON UPDATE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(60) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_estado INTEGER NOT NULL REFERENCES "estado"(id_estado) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_verified_by INTEGER REFERENCES "user"(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    verified_at TIMESTAMP,
    rejection_reason VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "match_payment_check" (
    id_match_payment_check SERIAL PRIMARY KEY,
    id_reservation INTEGER NOT NULL REFERENCES "reservation"(id_reservation) ON DELETE CASCADE ON UPDATE CASCADE,
    id_player INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE ON UPDATE CASCADE,
    id_team INTEGER NOT NULL,
    paid BOOLEAN DEFAULT FALSE NOT NULL,
    paid_at TIMESTAMP,
    id_checked_by INTEGER REFERENCES "user"(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE (id_reservation, id_player)
);

-- 6. Equipos e Inscripciones
CREATE TABLE IF NOT EXISTS "team" (
    id_team SERIAL PRIMARY KEY,
    id_tenant INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_user INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    name VARCHAR(100) NOT NULL,
    logo_emoji VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS "player_profile" (
    id_player SERIAL PRIMARY KEY,
    id_user INTEGER UNIQUE NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    visibility VARCHAR(20) DEFAULT 'public' NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    avatar_url VARCHAR(500),
    goals INTEGER DEFAULT 0 NOT NULL,
    assists INTEGER DEFAULT 0 NOT NULL,
    matches_played INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "team_player" (
    id_team_player SERIAL PRIMARY KEY,
    id_team INTEGER NOT NULL REFERENCES "team"(id_team) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_player INTEGER NOT NULL REFERENCES "player_profile"(id_player) ON DELETE RESTRICT ON UPDATE CASCADE,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (id_team, id_player)
);

-- 7. Torneos y Fixture
CREATE TABLE IF NOT EXISTS "tournament" (
    id_tournament SERIAL PRIMARY KEY,
    id_tenant INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_court INTEGER NOT NULL REFERENCES "court"(id_court) ON DELETE RESTRICT ON UPDATE CASCADE,
    name VARCHAR(100) NOT NULL,
    format VARCHAR(30) DEFAULT 'todos-contra-todos' NOT NULL,
    fixture_mode VARCHAR(20) DEFAULT 'aleatorio' NOT NULL,
    min_teams INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    id_requested_by INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_estado INTEGER NOT NULL REFERENCES "estado"(id_estado) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_approved_by INTEGER REFERENCES "user"(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    approved_at TIMESTAMP,
    rejection_reason VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "team_tournament" (
    id_team_tournament SERIAL PRIMARY KEY,
    id_team INTEGER NOT NULL REFERENCES "team"(id_team) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_tournament INTEGER NOT NULL REFERENCES "tournament"(id_tournament) ON DELETE RESTRICT ON UPDATE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (id_team, id_tournament)
);

CREATE TABLE IF NOT EXISTS "match" (
    id_match SERIAL PRIMARY KEY,
    id_tournament INTEGER REFERENCES "tournament"(id_tournament) ON DELETE SET NULL ON UPDATE CASCADE,
    id_court INTEGER NOT NULL REFERENCES "court"(id_court) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_home_team INTEGER NOT NULL REFERENCES "team"(id_team) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_away_team INTEGER NOT NULL REFERENCES "team"(id_team) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_player INTEGER REFERENCES "player_profile"(id_player) ON DELETE RESTRICT ON UPDATE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    home_goals INTEGER DEFAULT 0 NOT NULL,
    away_goals INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled' NOT NULL,
    yellow_card VARCHAR(30),
    red_card VARCHAR(30),
    assists INTEGER DEFAULT 0 NOT NULL,
    result_locked BOOLEAN DEFAULT FALSE NOT NULL,
    audit_trail TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    round INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "match_stat" (
    id_match_stat SERIAL PRIMARY KEY,
    id_match INTEGER NOT NULL REFERENCES "match"(id_match) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_player INTEGER NOT NULL REFERENCES "player_profile"(id_player) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_team INTEGER NOT NULL REFERENCES "team"(id_team) ON DELETE RESTRICT ON UPDATE CASCADE,
    goals INTEGER DEFAULT 0 NOT NULL,
    assists INTEGER DEFAULT 0 NOT NULL,
    yellow_cards INTEGER DEFAULT 0 NOT NULL,
    red_cards INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "standing" (
    id_standing SERIAL PRIMARY KEY,
    id_tournament INTEGER NOT NULL REFERENCES "tournament"(id_tournament) ON DELETE RESTRICT ON UPDATE CASCADE,
    id_team INTEGER NOT NULL REFERENCES "team"(id_team) ON DELETE RESTRICT ON UPDATE CASCADE,
    points INTEGER DEFAULT 0 NOT NULL,
    matches_played INTEGER DEFAULT 0 NOT NULL,
    wins INTEGER DEFAULT 0 NOT NULL,
    draws INTEGER DEFAULT 0 NOT NULL,
    losses INTEGER DEFAULT 0 NOT NULL,
    goals_for INTEGER DEFAULT 0 NOT NULL,
    goals_against INTEGER DEFAULT 0 NOT NULL,
    goal_difference INTEGER DEFAULT 0 NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    UNIQUE (id_tournament, id_team)
);

-- 8. Notificaciones
CREATE TABLE IF NOT EXISTS "notification" (
    id_notification SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    type VARCHAR(80) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    position INTEGER
);

-- INDICES CLAVE
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_reservation_date ON "reservation"(date);
CREATE INDEX IF NOT EXISTS idx_match_scheduled_at ON "match"(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payment_reservation ON "payment"(id_reservation);
