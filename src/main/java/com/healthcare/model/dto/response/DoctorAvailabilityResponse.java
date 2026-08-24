package com.healthcare.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Enhanced doctor response for the public listing endpoint.
 * Extends the core doctor profile with slot availability for a requested date.
 *
 * <p>If a {@code date} query param is provided:
 * <ul>
 *   <li>{@code availableSlots} — list of available slot start times for that date</li>
 *   <li>{@code nextAvailableDate} — {@code null} (date was explicitly provided)</li>
 * </ul>
 *
 * <p>If no {@code date} is provided:
 * <ul>
 *   <li>{@code availableSlots} — empty list</li>
 *   <li>{@code nextAvailableDate} — first date with at least one open slot in the next 14 days</li>
 * </ul>
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DoctorAvailabilityResponse {

    // ── Core profile ──────────────────────────────────────────────────────────
    private UUID          id;
    private String        firstName;
    private String        lastName;
    private String        email;
    private String        specialisation;
    private String        bio;
    private Integer       slotDurationMinutes;
    private Boolean       isAvailable;

    private List<DoctorResponse.WorkingHoursSummary> workingHours;

    // ── Slot availability (populated based on query params) ───────────────────

    /**
     * Available slot start times for the requested date.
     * Present when a {@code date} query param is supplied.
     */
    private List<LocalDateTime> availableSlots;

    /**
     * The first date within 14 days that has at least one open slot.
     * Present when no {@code date} query param is supplied.
     */
    private LocalDate nextAvailableDate;
}
