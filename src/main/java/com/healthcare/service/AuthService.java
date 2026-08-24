package com.healthcare.service;

import com.healthcare.exception.AppException;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.request.LoginRequest;
import com.healthcare.model.dto.request.RegisterRequest;
import com.healthcare.model.dto.response.AuthResponse;
import com.healthcare.model.dto.response.UserSummaryResponse;
import com.healthcare.model.entity.Patient;
import com.healthcare.model.entity.User;
import com.healthcare.model.enums.Role;
import com.healthcare.repository.PatientRepository;
import com.healthcare.repository.UserRepository;
import com.healthcare.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles all authentication flows:
 * <ol>
 *   <li>Patient self-registration (PATIENT role only)</li>
 *   <li>Login — issue access + refresh tokens</li>
 *   <li>Refresh — validate refresh token, rotate and re-issue</li>
 *   <li>Logout — revoke stored refresh token</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository        userRepository;
    private final PatientRepository     patientRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtUtil               jwtUtil;
    private final AuthenticationManager authManager;
    private final UserDetailsService    userDetailsService;

    @Value("${jwt.expiry-ms}")
    private long expiryMs;

    // ── Register ──────────────────────────────────────────────────────────────

    /**
     * Registers a new PATIENT user and creates a blank patient profile.
     * Doctors are created only by admins via the admin API.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Enforce PATIENT-only self-registration
        if (request.getRole() != null && request.getRole() != Role.PATIENT) {
            throw new AppException(HttpStatus.FORBIDDEN,
                    "Self-registration is only allowed for PATIENT role. " +
                    "Doctor accounts are created by an administrator.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "An account with this email already exists.");
        }
        if (request.getPhone() != null
                && userRepository.existsByPhoneNumber(request.getPhone())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "An account with this phone number already exists.");
        }

        // Save user with BCrypt-hashed password
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhone())
                .role(Role.PATIENT)
                .build();
        user = userRepository.save(user);

        // Create blank patient profile
        patientRepository.save(Patient.builder().user(user).build());

        log.info("Registered new patient: {}", user.getEmail());
        return buildAuthResponse(user, true);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    /**
     * Validates email/password credentials and returns tokens + user summary.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        if (!user.getIsActive()) {
            throw new AppException(HttpStatus.FORBIDDEN,
                    "Your account has been deactivated. Please contact support.");
        }

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, true);
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    /**
     * Validates the supplied refresh token, rotates it, and returns a new access token.
     * The new {@link AuthResponse} does NOT include a refreshToken field (client keeps
     * the same refresh token until it expires or logout is called).
     */
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        // 1. Structural validation
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new AppException(HttpStatus.UNAUTHORIZED,
                    "Refresh token is invalid or has expired. Please log in again.");
        }

        // 2. Must be stored in DB (proves it hasn't been revoked)
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED,
                        "Refresh token not recognised. Please log in again."));

        log.info("Issuing new access token for: {}", user.getEmail());
        return buildAuthResponse(user, false);  // false = don't include refresh token in response
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    /**
     * Revokes the stored refresh token for the authenticated user.
     */
    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email)
                .ifPresent(u -> userRepository.updateRefreshToken(u.getId(), null));
        log.info("User logged out: {}", email);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, boolean includeRefreshToken) {
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());

        String accessToken  = jwtUtil.generateAccessToken(details);
        String refreshToken = jwtUtil.generateRefreshToken(details);

        // Always rotate and persist the refresh token
        userRepository.updateRefreshToken(user.getId(), refreshToken);

        UserSummaryResponse userSummary = UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(includeRefreshToken ? refreshToken : null)
                .expiresIn(expiryMs / 1000)
                .user(userSummary)
                .build();
    }
}
