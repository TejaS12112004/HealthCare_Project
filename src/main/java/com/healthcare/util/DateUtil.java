package com.healthcare.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for common date/time formatting and conversion operations.
 * All methods are stateless and thread-safe.
 */
public final class DateUtil {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private static final DateTimeFormatter DATETIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    private static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private DateUtil() {
        // Utility class — no instantiation
    }

    // ── Formatting ────────────────────────────────────────────────────────────

    /** Formats a {@link LocalDate} as "dd-MM-yyyy". */
    public static String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : null;
    }

    /** Formats a {@link LocalDateTime} as "dd-MM-yyyy HH:mm". */
    public static String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATETIME_FORMATTER) : null;
    }

    /** Formats a {@link LocalDateTime} as ISO-8601 string. */
    public static String toIso(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(ISO_FORMATTER) : null;
    }

    // ── Parsing ───────────────────────────────────────────────────────────────

    /** Parses a "dd-MM-yyyy" string to {@link LocalDate}. */
    public static LocalDate parseDate(String date) {
        return date != null ? LocalDate.parse(date, DATE_FORMATTER) : null;
    }

    // ── Checks ────────────────────────────────────────────────────────────────

    /** Returns true if the given date is today or in the future. */
    public static boolean isFutureOrToday(LocalDate date) {
        return date != null && !date.isBefore(LocalDate.now(IST));
    }

    /** Returns true if the given date-time is in the future. */
    public static boolean isFuture(LocalDateTime dateTime) {
        return dateTime != null && dateTime.isAfter(LocalDateTime.now(IST));
    }

    /** Returns the current date-time in IST. */
    public static LocalDateTime nowIst() {
        return LocalDateTime.now(IST);
    }
}
