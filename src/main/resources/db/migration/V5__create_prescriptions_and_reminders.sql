-- ===========================================================================
-- V5__create_prescriptions_and_reminders.sql
-- Healthcare Appointment Manager – Prescriptions & Medication Reminders
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- PRESCRIPTIONS
-- end_date is automatically computed as start_date + duration_days
-- (PostgreSQL DATE + INTEGER = DATE, valid for GENERATED ALWAYS AS STORED)
-- ---------------------------------------------------------------------------
CREATE TABLE prescriptions (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id  UUID         NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    medication_name VARCHAR(255) NOT NULL,
    dosage          VARCHAR(100),
    frequency       VARCHAR(30)  NOT NULL
                    CHECK (frequency IN ('ONCE_DAILY','TWICE_DAILY','THRICE_DAILY')),
    duration_days   INT          NOT NULL CHECK (duration_days > 0),
    start_date      DATE         NOT NULL,
    end_date        DATE         GENERATED ALWAYS AS (start_date + duration_days) STORED,
    instructions    TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_appointment ON prescriptions (appointment_id);
CREATE INDEX idx_prescriptions_end_date    ON prescriptions (end_date);   -- useful for expiry queries

-- ---------------------------------------------------------------------------
-- MEDICATION REMINDERS
-- Scheduler reads rows WHERE is_active = TRUE to dispatch emails/notifications
-- ---------------------------------------------------------------------------
CREATE TABLE medication_reminders (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID        NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    patient_id      UUID        NOT NULL REFERENCES patients(id)      ON DELETE CASCADE,
    scheduled_time  TIME        NOT NULL,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index: scheduler only queries active reminders
CREATE INDEX idx_reminders_active
    ON medication_reminders (is_active)
    WHERE is_active = TRUE;

CREATE INDEX idx_reminders_prescription ON medication_reminders (prescription_id);
CREATE INDEX idx_reminders_patient      ON medication_reminders (patient_id);
