-- ===========================================================================
-- V1__init_schema.sql
-- Healthcare Appointment & Follow-up Manager – Initial Schema
-- Compatible with: PostgreSQL 15+ (Supabase)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- EXTENSION
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- Note: Hibernate uses VARCHAR(255) with @Enumerated(STRING); native PG
-- types are defined here for schema integrity checks.
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('PENDING','CONFIRMED','CANCELLED','COMPLETED','RESCHEDULED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('LOW','MEDIUM','HIGH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE llm_status AS ENUM ('PENDING','COMPLETED','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE reminder_frequency AS ENUM ('ONCE_DAILY','TWICE_DAILY','THRICE_DAILY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                 BIGSERIAL    PRIMARY KEY,
    first_name         VARCHAR(100) NOT NULL,
    last_name          VARCHAR(100) NOT NULL,
    email              VARCHAR(255) NOT NULL,
    password_hash      TEXT         NOT NULL,
    phone_number       VARCHAR(20),
    role               VARCHAR(20)  NOT NULL DEFAULT 'PATIENT',
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    is_email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    refresh_token      TEXT,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_users_email        UNIQUE (email),
    CONSTRAINT uk_users_phone        UNIQUE (phone_number),
    CONSTRAINT chk_users_role        CHECK  (role IN ('PATIENT','DOCTOR','ADMIN'))
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_active   ON users (is_active);

-- ---------------------------------------------------------------------------
-- SPECIALISATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS specialisations (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_specialisations_name UNIQUE (name)
);

-- Seed a small set of common specialisations
INSERT INTO specialisations (name, description) VALUES
    ('General Practice',  'Primary care and general health consultations'),
    ('Cardiology',        'Heart and cardiovascular conditions'),
    ('Orthopedics',       'Bone, joint, and musculoskeletal conditions'),
    ('Pediatrics',        'Medical care for children and adolescents'),
    ('Dermatology',       'Skin, hair, and nail conditions'),
    ('Neurology',         'Nervous system disorders'),
    ('Gynecology',        'Female reproductive health'),
    ('Ophthalmology',     'Eye and vision care'),
    ('ENT',               'Ear, nose, and throat conditions'),
    ('Psychiatry',        'Mental health and psychiatric disorders')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- DOCTORS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id                   BIGSERIAL      PRIMARY KEY,
    user_id              BIGINT         NOT NULL,
    licence_number       VARCHAR(50)    NOT NULL,
    years_of_experience  INTEGER,
    date_of_birth        DATE,
    bio                  TEXT,
    consultation_fee     NUMERIC(10,2),
    average_rating       NUMERIC(3,2)   DEFAULT 0.00,
    total_reviews        INTEGER        NOT NULL DEFAULT 0,
    is_available         BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_doctors_user        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_doctors_user_id     UNIQUE (user_id),
    CONSTRAINT uk_doctors_licence     UNIQUE (licence_number),
    CONSTRAINT chk_doctors_rating     CHECK (average_rating >= 0 AND average_rating <= 5),
    CONSTRAINT chk_doctors_fee        CHECK (consultation_fee IS NULL OR consultation_fee >= 0)
);

CREATE INDEX IF NOT EXISTS idx_doctors_user_id     ON doctors (user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_available   ON doctors (is_available);

-- ---------------------------------------------------------------------------
-- DOCTOR ↔ SPECIALISATION  (join table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctor_specialisations (
    doctor_id          BIGINT NOT NULL,
    specialisation_id  BIGINT NOT NULL,

    PRIMARY KEY (doctor_id, specialisation_id),
    CONSTRAINT fk_ds_doctor         FOREIGN KEY (doctor_id)         REFERENCES doctors        (id) ON DELETE CASCADE,
    CONSTRAINT fk_ds_specialisation FOREIGN KEY (specialisation_id) REFERENCES specialisations (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- PATIENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id                      BIGSERIAL    PRIMARY KEY,
    user_id                 BIGINT       NOT NULL,
    date_of_birth           DATE,
    gender                  VARCHAR(20),
    blood_group             VARCHAR(10),
    allergies               TEXT,
    chronic_conditions      TEXT,
    current_medications     TEXT,
    emergency_contact_name  VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    address                 TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    pincode                 VARCHAR(10),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_patients_user   FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_patients_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients (user_id);

-- ---------------------------------------------------------------------------
-- updated_at auto-update trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Attach trigger to each table that has updated_at
DO $$ DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','specialisations','doctors','patients'] LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
             CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
            t, t, t, t
        );
    END LOOP;
END $$;
