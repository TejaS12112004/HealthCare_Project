-- ===========================================================================
-- V3__create_appointments.sql
-- Healthcare Appointment Manager – Slot Holds & Appointments
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- SLOT HOLDS  (optimistic locking during booking flow)
-- Holds expire automatically; the application also cleans them up.
-- ---------------------------------------------------------------------------
CREATE TABLE slot_holds (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID        NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
    patient_id  UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    slot_time   TIMESTAMPTZ NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_released BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index: fast lookup of unexpired, unreleased holds
CREATE INDEX idx_slot_holds_expires
    ON slot_holds (expires_at)
    WHERE is_released = FALSE;

CREATE INDEX idx_slot_holds_doctor_slot
    ON slot_holds (doctor_id, slot_time)
    WHERE is_released = FALSE;

-- ---------------------------------------------------------------------------
-- APPOINTMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE appointments (
    id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id                       UUID        NOT NULL REFERENCES doctors(id)  ON DELETE RESTRICT,
    patient_id                      UUID        NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    slot_time                       TIMESTAMPTZ NOT NULL,
    status                          VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','CONFIRMED','CANCELLED','COMPLETED','RESCHEDULED')),
    google_calendar_event_id_patient VARCHAR(255),
    google_calendar_event_id_doctor  VARCHAR(255),
    cancelled_reason                TEXT,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- DB-level double-booking prevention
    UNIQUE (doctor_id, slot_time)
);

-- Performance indexes
CREATE INDEX idx_appointments_doctor_slot
    ON appointments (doctor_id, slot_time);

CREATE INDEX idx_appointments_patient
    ON appointments (patient_id);

CREATE INDEX idx_appointments_status
    ON appointments (status);

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
