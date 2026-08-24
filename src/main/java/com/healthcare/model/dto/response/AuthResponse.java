package com.healthcare.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

/**
 * Response body for all auth endpoints: register, login, and refresh.
 *
 * <pre>
 * {
 *   "accessToken"  : "eyJ...",
 *   "refreshToken" : "eyJ...",     ← null on refresh responses
 *   "tokenType"    : "Bearer",
 *   "expiresIn"    : 900,          ← access token TTL in seconds
 *   "user" : {
 *     "id"        : "uuid",
 *     "email"     : "...",
 *     "firstName" : "...",
 *     "lastName"  : "...",
 *     "role"      : "PATIENT"
 *   }
 * }
 * </pre>
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;

    /** Present on login/register; {@code null} on refresh responses. */
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    /** Access token TTL in seconds. */
    private Long expiresIn;

    /** Compact user object for immediate frontend use. */
    private UserSummaryResponse user;
}
