-- ===========================================================================
-- V2__create_doctors_and_patients.sql
-- Healthcare Appointment Manager – Doctor & Patient Profiles
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- SPECIALISATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE specialisations (
    id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Seed common specialisations
INSERT INTO specialisations (name) VALUES
    ('General Practice'),
    ('Cardiology'),
    ('Orthopedics'),
    ('Pediatrics'),
    ('Dermatology'),
    ('Neurology'),
    ('Gynecology'),
    ('Ophthalmology'),
    ('ENT'),
    ('Psychiatry')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- DOCTORS
-- ---------------------------------------------------------------------------
CREATE TABLE doctors (
    id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID  UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialisation_id     UUID  REFERENCES specialisations(id) ON DELETE SET NULL,
    bio                   TEXT,
    licence_number        VARCHAR(50) UNIQUE,
    years_of_experience   INT,
    consultation_fee      NUMERIC(10,2) CHECK (consultation_fee >= 0),
    average_rating        NUMERIC(3,2)  DEFAULT 0.00 CHECK (average_rating BETWEEN 0 AND 5),
    total_reviews         INT           NOT NULL DEFAULT 0,
    is_available          BOOLEAN       NOT NULL DEFAULT TRUE,
    slot_duration_minutes INT           NOT NULL DEFAULT 30 CHECK (slot_duration_minutes > 0),
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_user_id         ON doctors (user_id);
CREATE INDEX idx_doctors_specialisation  ON doctors (specialisation_id);
CREATE INDEX idx_doctors_available       ON doctors (is_available);

CREATE TRIGGER trg_doctors_updated_at
BEFORE UPDATE ON doctors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- DOCTOR WORKING HOURS
-- ---------------------------------------------------------------------------
CREATE TABLE doctor_working_hours (
    id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID  NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INT   NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0 = Sunday
    start_time  TIME  NOT NULL,
    end_time    TIME  NOT NULL,
    CONSTRAINT  chk_working_hours_order CHECK (end_time > start_time),
    UNIQUE (doctor_id, day_of_week)
);

CREATE INDEX idx_working_hours_doctor ON doctor_working_hours (doctor_id);

-- ---------------------------------------------------------------------------
-- DOCTOR LEAVE DAYS
-- ---------------------------------------------------------------------------
CREATE TABLE doctor_leave_days (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id  UUID         NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    leave_date DATE         NOT NULL,
    reason     VARCHAR(255),
    UNIQUE (doctor_id, leave_date)
);

CREATE INDEX idx_leave_days_doctor ON doctor_leave_days (doctor_id, leave_date);

-- ---------------------------------------------------------------------------
-- PATIENTS
-- ---------------------------------------------------------------------------
CREATE TABLE patients (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth         DATE,
    gender                VARCHAR(20),
    blood_group           VARCHAR(10),
    allergies             TEXT,
    chronic_conditions    TEXT,
    current_medications   TEXT,
    emergency_contact     VARCHAR(20),
    address               TEXT,
    city                  VARCHAR(100),
    state                 VARCHAR(100),
    pincode               VARCHAR(10),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_user_id ON patients (user_id);

CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
