package com.healthcare.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalTime;

/**
 * One working-hours slot for a specific day of the week.
 * Used inside {@link CreateDoctorRequest} and {@link UpdateDoctorRequest}.
 *
 * <p>{@code dayOfWeek}: 0 = Sunday … 6 = Saturday (matches PostgreSQL {@code doctor_working_hours.day_of_week}).
 */
@Data
public class WorkingHoursDto {

    @NotNull(message = "dayOfWeek is required")
    @Min(value = 0, message = "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)")
    @Max(value = 6, message = "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)")
    private Integer dayOfWeek;

    @NotNull(message = "startTime is required")
    private LocalTime startTime;

    @NotNull(message = "endTime is required")
    private LocalTime endTime;
}
