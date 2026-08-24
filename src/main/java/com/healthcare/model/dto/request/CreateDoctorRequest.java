package com.healthcare.model.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Admin-only request body for {@code POST /api/v1/admin/doctors}.
 * The service auto-generates a temporary password for the doctor;
 * the doctor should use a password-reset flow to set their own.
 */
@Data
public class CreateDoctorRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 100)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid 10-digit Indian mobile number")
    private String phone;

    /** UUID of the doctor's primary specialisation (must exist in the specialisations table). */
    private UUID specialisationId;

    @Size(max = 2000, message = "Bio cannot exceed 2000 characters")
    private String bio;

    @Min(value = 10, message = "Slot duration must be at least 10 minutes")
    @Max(value = 120, message = "Slot duration cannot exceed 120 minutes")
    private Integer slotDurationMinutes = 30;

    /** Weekly working hours schedule. Each day of the week may appear at most once. */
    @Valid
    private List<WorkingHoursDto> workingHours;
}
