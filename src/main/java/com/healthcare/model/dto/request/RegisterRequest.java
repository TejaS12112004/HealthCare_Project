package com.healthcare.model.dto.request;

import com.healthcare.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for {@code POST /api/v1/auth/register}.
 * Only PATIENT self-registration is allowed; doctors are created by admins.
 * If {@code role} is provided, the service will reject anything other than PATIENT.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 100, message = "First name must be 2–100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 100, message = "Last name must be 2–100 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72,
          message = "Password must be between 8 and 72 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must have at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character"
    )
    private String password;

    @Pattern(regexp = "^[6-9]\\d{9}$",
             message = "Phone must be a valid 10-digit Indian mobile number")
    private String phone;

    /**
     * Optional — if supplied, must be PATIENT (doctors are registered by admins only).
     * Defaults to PATIENT in the service layer if omitted.
     */
    private Role role;
}
