package com.healthcare.util;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Utility class for generating and validating appointment time slots.
 * A "slot" is represented as a {@link LocalTime} indicating the slot start time.
 * All slots are assumed to be of equal duration (e.g., 15 or 30 minutes).
 */
public final class SlotUtil {

    /** Default slot duration in minutes. */
    private static final int DEFAULT_SLOT_MINUTES = 30;

    private SlotUtil() {
        // Utility class — no instantiation
    }

    /**
     * Generates all time slots between {@code from} and {@code to} with a
     * configurable duration.
     *
     * @param from          inclusive start time
     * @param to            exclusive end time
     * @param slotMinutes   slot duration in minutes
     * @return ordered list of slot start times
     */
    public static List<LocalTime> generateSlots(LocalTime from, LocalTime to, int slotMinutes) {
        List<LocalTime> slots = new ArrayList<>();
        LocalTime current = from;
        while (current.isBefore(to)) {
            slots.add(current);
            current = current.plusMinutes(slotMinutes);
        }
        return slots;
    }

    /**
     * Generates slots with the default 30-minute duration.
     */
    public static List<LocalTime> generateSlots(LocalTime from, LocalTime to) {
        return generateSlots(from, to, DEFAULT_SLOT_MINUTES);
    }

    /**
     * Returns true if the given slot time is in the past relative to today.
     * Useful for disabling already-passed slots on same-day booking.
     *
     * @param date       the appointment date
     * @param slotTime   the slot start time
     */
    public static boolean isSlotPast(LocalDate date, LocalTime slotTime) {
        if (date.isBefore(LocalDate.now())) {
            return true;
        }
        if (date.isEqual(LocalDate.now())) {
            return !slotTime.isAfter(LocalTime.now());
        }
        return false;
    }

    /**
     * Checks whether two slot windows overlap.
     *
     * @param s1Start start of first slot
     * @param s1End   end of first slot
     * @param s2Start start of second slot
     * @param s2End   end of second slot
     */
    public static boolean slotsOverlap(
            LocalTime s1Start, LocalTime s1End,
            LocalTime s2Start, LocalTime s2End) {
        return s1Start.isBefore(s2End) && s2Start.isBefore(s1End);
    }
}
