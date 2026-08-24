package com.healthcare.util;

import com.healthcare.model.entity.DoctorWorkingHours;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Pure utility class for generating and validating appointment time slots.
 * All methods are stateless and thread-safe.
 *
 * <h3>Slot model</h3>
 * A slot is identified by its {@link LocalDateTime} start time.
 * The slot end time is implicitly {@code slotStart + slotDurationMinutes}.
 *
 * <h3>Day-of-week convention</h3>
 * {@code DoctorWorkingHours.dayOfWeek}: 0 = Sunday … 6 = Saturday,
 * matching PostgreSQL convention and the {@code java.time.DayOfWeek} ordinal
 * shifted by 1 ({@code DayOfWeek.getValue()} returns 1=Monday … 7=Sunday).
 */
public final class SlotUtil {

    private static final int DEFAULT_SLOT_MINUTES = 30;

    private SlotUtil() {}

    // ── Core: DoctorWorkingHours overload (used by SlotService) ──────────────

    /**
     * Generates all slot start times for the given {@link DoctorWorkingHours} entry
     * on the supplied date, using the doctor's {@code slotDurationMinutes}.
     *
     * <p>The last slot included is the one whose <em>start</em> time + duration
     * still fits within {@code workingHours.endTime}:
     * <pre>
     * start = 09:00, end = 11:00, duration = 30 min
     * → 09:00, 09:30, 10:00, 10:30   (10:30 + 30 = 11:00 ≤ 11:00 ✓)
     * </pre>
     *
     * @param workingHours     the working-hours row (contains startTime / endTime)
     * @param date             the calendar date for which to generate slots
     * @param slotDurationMin  doctor's slot duration in minutes
     * @return ordered list of slot start {@link LocalDateTime}s; empty if hours are null
     */
    public static List<LocalDateTime> generateSlots(
            DoctorWorkingHours workingHours,
            LocalDate date,
            int slotDurationMin) {

        if (workingHours == null) {
            return List.of();
        }
        return generateSlots(workingHours.getStartTime(), workingHours.getEndTime(),
                date, slotDurationMin);
    }

    /**
     * Generates all slot {@link LocalDateTime}s between {@code startTime} and {@code endTime}
     * on the given {@code date}, stepping by {@code slotDurationMin}.
     * The end-time boundary is exclusive — only slots whose start + duration ≤ endTime are included.
     *
     * @param startTime       working window start (e.g. 09:00)
     * @param endTime         working window end   (e.g. 17:00)
     * @param date            the calendar date
     * @param slotDurationMin slot length in minutes (e.g. 30)
     * @return ordered list of slot start {@link LocalDateTime}s
     */
    public static List<LocalDateTime> generateSlots(
            LocalTime startTime,
            LocalTime endTime,
            LocalDate date,
            int slotDurationMin) {

        if (startTime == null || endTime == null || !endTime.isAfter(startTime)
                || slotDurationMin <= 0) {
            return List.of();
        }

        List<LocalDateTime> slots = new ArrayList<>();
        LocalTime cursor = startTime;
        while (!cursor.isAfter(endTime.minusMinutes(slotDurationMin))) {
            slots.add(date.atTime(cursor));
            cursor = cursor.plusMinutes(slotDurationMin);
        }
        return slots;
    }

    // ── LocalTime overloads (backward compat + tests) ─────────────────────────

    /**
     * Generates time-only slot starts (no date). Used for schedule display.
     */
    public static List<LocalTime> generateSlots(LocalTime from, LocalTime to, int slotMinutes) {
        if (from == null || to == null || !to.isAfter(from) || slotMinutes <= 0) {
            return List.of();
        }
        List<LocalTime> slots = new ArrayList<>();
        LocalTime cursor = from;
        while (!cursor.isAfter(to.minusMinutes(slotMinutes))) {
            slots.add(cursor);
            cursor = cursor.plusMinutes(slotMinutes);
        }
        return slots;
    }

    /** Generates time-only slots with the default 30-minute duration. */
    public static List<LocalTime> generateSlots(LocalTime from, LocalTime to) {
        return generateSlots(from, to, DEFAULT_SLOT_MINUTES);
    }

    // ── Helper predicates ─────────────────────────────────────────────────────

    /**
     * Returns {@code true} if the slot start is in the past
     * (already passed or today but past the current minute).
     */
    public static boolean isSlotPast(LocalDate date, LocalTime slotTime) {
        if (date == null || slotTime == null) return true;
        if (date.isBefore(LocalDate.now())) return true;
        if (date.isEqual(LocalDate.now())) return !slotTime.isAfter(LocalTime.now());
        return false;
    }

    /**
     * Returns {@code true} if the slot represented as {@link LocalDateTime} is in the past.
     */
    public static boolean isSlotPast(LocalDateTime slotDateTime) {
        return slotDateTime == null || !slotDateTime.isAfter(LocalDateTime.now());
    }

    /**
     * Maps a PostgreSQL-style {@code dayOfWeek} (0=Sunday … 6=Saturday)
     * to a {@link java.time.DayOfWeek} value.
     */
    public static java.time.DayOfWeek toDayOfWeek(int pgDayOfWeek) {
        // pg: 0=Sun,1=Mon,...,6=Sat
        // java.time.DayOfWeek: 1=Mon,...,7=Sun
        return switch (pgDayOfWeek) {
            case 0 -> java.time.DayOfWeek.SUNDAY;
            case 1 -> java.time.DayOfWeek.MONDAY;
            case 2 -> java.time.DayOfWeek.TUESDAY;
            case 3 -> java.time.DayOfWeek.WEDNESDAY;
            case 4 -> java.time.DayOfWeek.THURSDAY;
            case 5 -> java.time.DayOfWeek.FRIDAY;
            case 6 -> java.time.DayOfWeek.SATURDAY;
            default -> throw new IllegalArgumentException("Invalid dayOfWeek: " + pgDayOfWeek);
        };
    }

    /**
     * Returns the PostgreSQL-convention {@code day_of_week} int (0=Sun…6=Sat)
     * for the given {@link LocalDate}.
     */
    public static int pgDayOfWeek(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case SUNDAY    -> 0;
            case MONDAY    -> 1;
            case TUESDAY   -> 2;
            case WEDNESDAY -> 3;
            case THURSDAY  -> 4;
            case FRIDAY    -> 5;
            case SATURDAY  -> 6;
        };
    }

    /**
     * Checks whether two slot windows overlap.
     */
    public static boolean slotsOverlap(
            LocalTime s1Start, LocalTime s1End,
            LocalTime s2Start, LocalTime s2End) {
        return s1Start.isBefore(s2End) && s2Start.isBefore(s1End);
    }
}
