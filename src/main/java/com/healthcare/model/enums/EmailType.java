package com.healthcare.model.enums;

/**
 * Type of outbound email sent by the notification system.
 * Stored as VARCHAR in the {@code email_logs} table.
 */
public enum EmailType {
    BOOKING_CONFIRMATION,
    BOOKING_REMINDER,
    CANCELLATION,
    RESCHEDULED,
    POST_VISIT_SUMMARY,
    MEDICATION_REMINDER,
    ACCOUNT_VERIFICATION,
    PASSWORD_RESET
}
