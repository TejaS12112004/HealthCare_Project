package com.healthcare.controller;

import com.healthcare.exception.AppException;
import com.healthcare.model.dto.request.ChangePasswordRequest;
import com.healthcare.model.dto.request.LoginRequest;
import com.healthcare.model.dto.request.RegisterRequest;
import com.healthcare.model.dto.response.AuthResponse;
import com.healthcare.model.dto.response.UserSummaryResponse;
import com.healthcare.model.entity.User;
import com.healthcare.repository.UserRepository;
import com.healthcare.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication REST controller — all routes under {@code /api/v1/auth}.
 *
 * <table>
 *   <tr><td>POST /register</td><td>Patient self-registration</td></tr>
 *   <tr><td>POST /login</td><td>Credential login → tokens</td></tr>
 *   <tr><td>GET  /refresh</td><td>Rotate refresh token</td></tr>
 *   <tr><td>GET  /me</td><td>Current authenticated user</td></tr>
 *   <tr><td>POST /logout</td><td>Revoke refresh token</td></tr>
 * </table>
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, token refresh, and logout endpoints")
public class AuthController {

    private final AuthService    authService;
    private final UserRepository userRepository;

    // ── POST /api/v1/auth/register ────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Register a new patient account",
               description = "Only PATIENT self-registration is allowed. Doctors are created by admin.")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    // ── POST /api/v1/auth/login ───────────────────────────────────────────────

    @PostMapping("/login")
    @Operation(summary = "Login with email and password",
               description = "Returns access token (15 min) and refresh token (7 days).")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // ── GET /api/v1/auth/refresh?token= ──────────────────────────────────────

    @GetMapping("/refresh")
    @Operation(summary = "Refresh access token using a valid refresh token",
               description = "Pass the refresh token as a query parameter. Returns a new access token.")
    public ResponseEntity<AuthResponse> refresh(
            @Parameter(description = "The refresh token issued at login", required = true)
            @RequestParam("token") String token) {
        return ResponseEntity.ok(authService.refresh(token));
    }

    // ── GET /api/v1/auth/me ───────────────────────────────────────────────────

    @GetMapping("/me")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get the currently authenticated user's profile")
    public ResponseEntity<UserSummaryResponse> me(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED,
                    "No authenticated user found in the current context.");
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Authenticated user not found in database."));

        return ResponseEntity.ok(UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build());
    }

    // ── POST /api/v1/auth/change-password ─────────────────────────────────────

    @PostMapping("/change-password")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Change password for the authenticated user")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {

        if (userDetails == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Not authenticated.");
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found."));

        authService.changePassword(user.getId(), request);
        return ResponseEntity.noContent().build();
    }

    // ── POST /api/v1/auth/logout ──────────────────────────────────────────────

    @PostMapping("/logout")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Logout — revokes the stored refresh token")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
