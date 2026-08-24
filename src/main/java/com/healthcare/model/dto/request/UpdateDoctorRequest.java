package com.healthcare.model.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Admin-only request body for {@code PUT /api/v1/admin/doctors/{id}}.
 * All fields are optional — only non-null values are applied.
 * If {@code workingHours} is provided, all existing working hours are replaced.
 */
@Data
public class UpdateDoctorRequest {

    @Size(max = 2000)
    private String bio;

    private UUID specialisationId;

    @Min(10) @Max(120)
    private Integer slotDurationMinutes;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal consultationFee;

    private Boolean isAvailable;

    /**
     * If present (even if empty), replaces all working hours for the doctor.
     * If {@code null}, existing working hours are left unchanged.
     */
    @Valid
    private List<WorkingHoursDto> workingHours;
}
