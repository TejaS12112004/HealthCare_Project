package com.healthcare.model.dto.response;

import com.healthcare.model.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Lightweight user summary returned in list and search endpoints.
 */
@Data
@Builder
public class UserResponse {

    private Long          id;
    private String        firstName;
    private String        lastName;
    private String        email;
    private String        phoneNumber;
    private Role          role;
    private Boolean       isActive;
    private Boolean       isEmailVerified;
    private LocalDateTime createdAt;
}
