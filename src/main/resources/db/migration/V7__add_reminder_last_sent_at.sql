-- V7: Add last_sent_at to medication_reminders for deduplication and add performance index
ALTER TABLE medication_reminders
    ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

-- Partial index: only index active reminders (the ones actually queried by the scheduler)
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled
    ON medication_reminders (scheduled_time, last_sent_at)
    WHERE is_active = TRUE;
