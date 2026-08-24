package com.healthcare.model.dto.response;

import com.healthcare.model.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID          id;
    private String        firstName;
    private String        lastName;
    private String        email;
    private String        phoneNumber;
    private Role          role;
    private Boolean       isActive;
    private Boolean       isEmailVerified;
    private LocalDateTime createdAt;
}
