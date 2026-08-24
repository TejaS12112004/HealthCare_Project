package com.healthcare.model.dto.response;

import com.healthcare.model.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Compact user object embedded inside {@link AuthResponse}.
 * Contains only the fields a frontend needs immediately after login/register.
 */
@Data
@Builder
public class UserSummaryResponse {

    private UUID   id;
    private String email;
    private String firstName;
    private String lastName;
    private Role   role;
}
