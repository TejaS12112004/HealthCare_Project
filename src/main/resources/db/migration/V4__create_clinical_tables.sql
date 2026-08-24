-- ===========================================================================
-- V4__create_clinical_tables.sql
-- Healthcare Appointment Manager – Symptom Forms, Pre/Post-Visit Summaries
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- SYMPTOM FORMS  (patient fills before appointment)
-- ---------------------------------------------------------------------------
CREATE TABLE symptom_forms (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id   UUID        UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    symptoms         TEXT        NOT NULL,
    duration_days    INT         CHECK (duration_days >= 0),
    severity         VARCHAR(20) CHECK (severity IN ('MILD','MODERATE','SEVERE')),
    additional_notes TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_symptom_forms_appointment ON symptom_forms (appointment_id);

-- ---------------------------------------------------------------------------
-- PRE-VISIT SUMMARIES  (LLM-generated from symptom form)
-- ---------------------------------------------------------------------------
CREATE TABLE pre_visit_summaries (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id     UUID        UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    urgency_level      VARCHAR(10) CHECK (urgency_level IN ('LOW','MEDIUM','HIGH')),
    chief_complaint    TEXT,
    suggested_questions TEXT,         -- JSON array stored as text
    llm_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                       CHECK (llm_status IN ('PENDING','COMPLETED','FAILED')),
    llm_raw_response   TEXT,
    retry_count        INT         NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pre_visit_appointment ON pre_visit_summaries (appointment_id);
CREATE INDEX idx_pre_visit_llm_status  ON pre_visit_summaries (llm_status)
    WHERE llm_status IN ('PENDING','FAILED');

CREATE TRIGGER trg_pre_visit_summaries_updated_at
BEFORE UPDATE ON pre_visit_summaries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- POST-VISIT NOTES  (doctor writes after appointment)
-- ---------------------------------------------------------------------------
CREATE TABLE post_visit_notes (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID        UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    clinical_notes TEXT        NOT NULL,
    submitted_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_visit_notes_appointment  ON post_visit_notes (appointment_id);
CREATE INDEX idx_post_visit_notes_submitted_by ON post_visit_notes (submitted_by);

-- ---------------------------------------------------------------------------
-- POST-VISIT SUMMARIES  (LLM-generated patient-friendly summary)
-- ---------------------------------------------------------------------------
CREATE TABLE post_visit_summaries (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id          UUID        UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_friendly_summary TEXT,
    medication_schedule      TEXT,
    follow_up_steps          TEXT,
    llm_status               VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                             CHECK (llm_status IN ('PENDING','COMPLETED','FAILED')),
    llm_raw_response         TEXT,
    retry_count              INT         NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_visit_summaries_appointment ON post_visit_summaries (appointment_id);
CREATE INDEX idx_post_visit_summaries_llm_status  ON post_visit_summaries (llm_status)
    WHERE llm_status IN ('PENDING','FAILED');

CREATE TRIGGER trg_post_visit_summaries_updated_at
BEFORE UPDATE ON post_visit_summaries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
