package com.healthcare.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Request body for ADMIN to create a Doctor account.
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

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72)
    private String password;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid phone number")
    private String phoneNumber;

    @NotBlank(message = "Licence number is required")
    private String licenceNumber;

    @Min(value = 0, message = "Years of experience cannot be negative")
    @Max(value = 60, message = "Years of experience seems unrealistic")
    private Integer yearsOfExperience;

    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;

    @DecimalMin(value = "0.0", inclusive = false, message = "Consultation fee must be positive")
    private java.math.BigDecimal consultationFee;

    /** IDs of specialisations to assign. */
    private java.util.Set<Long> specialisationIds;
}
