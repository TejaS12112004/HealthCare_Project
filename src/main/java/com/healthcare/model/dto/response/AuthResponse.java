package com.healthcare.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.healthcare.model.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private Long   expiresIn;
    private UUID   userId;
    private String email;
    private String fullName;
    private Role   role;
}
