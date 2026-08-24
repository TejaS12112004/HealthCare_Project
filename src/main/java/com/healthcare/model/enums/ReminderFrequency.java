package com.healthcare.model.enums;

/**
 * Frequency at which reminders are sent to patients for medication or appointments.
 */
public enum ReminderFrequency {
    /** One reminder per day. */
    ONCE_DAILY,

    /** Two reminders per day (e.g., morning and evening). */
    TWICE_DAILY,

    /** Three reminders per day (e.g., morning, afternoon, and night). */
    THRICE_DAILY
}
