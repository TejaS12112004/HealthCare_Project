-- ===========================================================================
-- V1__create_users_and_roles.sql
-- Healthcare Appointment Manager – Users & Auth
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- EXTENSION (UUID generation)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email                         VARCHAR(255) UNIQUE NOT NULL,
    password_hash                 VARCHAR(255) NOT NULL,
    role                          VARCHAR(20)  NOT NULL CHECK (role IN ('PATIENT','DOCTOR','ADMIN')),
    first_name                    VARCHAR(100) NOT NULL,
    last_name                     VARCHAR(100) NOT NULL,
    phone                         VARCHAR(20),
    is_active                     BOOLEAN      NOT NULL DEFAULT TRUE,
    is_email_verified             BOOLEAN      NOT NULL DEFAULT FALSE,
    refresh_token                 TEXT,
    google_calendar_token         TEXT,        -- encrypted OAuth access token
    google_calendar_refresh_token TEXT,        -- encrypted OAuth refresh token
    created_at                    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_role     ON users (role);
CREATE INDEX idx_users_active   ON users (is_active);

-- ---------------------------------------------------------------------------
-- Auto-update trigger for updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
