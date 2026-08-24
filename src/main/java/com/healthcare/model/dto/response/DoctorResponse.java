package com.healthcare.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Full doctor profile response, including working hours and active status.
 * Used by both admin and public-facing doctor endpoints.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DoctorResponse {

    private UUID          id;
    private UUID          userId;
    private String        firstName;
    private String        lastName;
    private String        email;
    private String        phoneNumber;
    private String        specialisation;       // specialisation name (ManyToOne)
    private UUID          specialisationId;
    private String        bio;
    private Integer       slotDurationMinutes;
    private Boolean       isAvailable;
    private Boolean       isActive;             // mirrors user.isActive

    // Extended fields (may be null for public views)
    private String        licenceNumber;
    private Integer       yearsOfExperience;
    private LocalDate     dateOfBirth;
    private BigDecimal    consultationFee;
    private BigDecimal    averageRating;
    private Integer       totalReviews;

    /** Full weekly schedule. */
    private List<WorkingHoursSummary> workingHours;

    private LocalDateTime createdAt;

    // ── Nested DTO ────────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class WorkingHoursSummary {
        private Integer   dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
    }

    /**
     * Only populated when a doctor is first created (temp password for first login).
     * The field is {@code null} in all subsequent GET responses.
     */
    private String tempPassword;
}
