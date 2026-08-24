-- ===========================================================================
-- V6__create_notification_log.sql
-- Healthcare Appointment Manager – Email Audit Log & Performance Indexes
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- EMAIL LOGS  (audit trail for all outbound emails)
-- ---------------------------------------------------------------------------
CREATE TABLE email_logs (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email  VARCHAR(255) NOT NULL,
    subject          VARCHAR(255) NOT NULL,
    email_type       VARCHAR(50)  NOT NULL
                     CHECK (email_type IN (
                         'BOOKING_CONFIRMATION',
                         'BOOKING_REMINDER',
                         'CANCELLATION',
                         'RESCHEDULED',
                         'POST_VISIT_SUMMARY',
                         'MEDICATION_REMINDER',
                         'ACCOUNT_VERIFICATION',
                         'PASSWORD_RESET'
                     )),
    appointment_id   UUID         REFERENCES appointments(id) ON DELETE SET NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','SENT','FAILED')),
    retry_count      INT          NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    error_message    TEXT,
    sent_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Partial index: email retry job only looks at pending entries
CREATE INDEX idx_email_logs_status
    ON email_logs (status)
    WHERE status = 'PENDING';

CREATE INDEX idx_email_logs_appointment  ON email_logs (appointment_id);
CREATE INDEX idx_email_logs_recipient    ON email_logs (recipient_email);
CREATE INDEX idx_email_logs_created_at   ON email_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- Additional cross-table performance indexes
-- (placed here as they depend on V3–V5 tables already existing)
-- ---------------------------------------------------------------------------

-- Fast availability check: "is this doctor booked for this slot?"
CREATE INDEX idx_appointments_doctor_slot_status
    ON appointments (doctor_id, slot_time)
    WHERE status NOT IN ('CANCELLED','RESCHEDULED');

-- Fast patient appointment history
CREATE INDEX idx_appointments_patient_status
    ON appointments (patient_id, status);

-- LLM retry worker: find all pending/failed summaries quickly
CREATE INDEX idx_pre_visit_pending
    ON pre_visit_summaries (created_at)
    WHERE llm_status IN ('PENDING','FAILED') AND retry_count < 3;

CREATE INDEX idx_post_visit_pending
    ON post_visit_summaries (created_at)
    WHERE llm_status IN ('PENDING','FAILED') AND retry_count < 3;

-- Prescription expiry scanner
CREATE INDEX idx_prescriptions_active_range
    ON prescriptions (start_date, end_date);
