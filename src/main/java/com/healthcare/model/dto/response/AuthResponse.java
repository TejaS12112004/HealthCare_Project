package com.healthcare.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.healthcare.model.enums.Role;
import lombok.Builder;
import lombok.Data;

/**
 * Response body for successful login / token refresh.
 * {@code refreshToken} is only included in the login response, not refresh.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;

    /** Included only at initial login; null on refresh responses. */
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private Long   expiresIn;    // access token TTL in seconds
    private Long   userId;
    private String email;
    private String fullName;
    private Role   role;
}
