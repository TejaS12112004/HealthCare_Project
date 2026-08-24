package com.healthcare.service;

import com.healthcare.exception.AppException;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.request.LoginRequest;
import com.healthcare.model.dto.request.RefreshTokenRequest;
import com.healthcare.model.dto.request.RegisterRequest;
import com.healthcare.model.dto.response.AuthResponse;
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
 * Service responsible for authentication flows:
 * <ul>
 *   <li>Patient self-registration</li>
 *   <li>Login (issue access + refresh tokens)</li>
 *   <li>Refresh token rotation</li>
 *   <li>Logout (revoke refresh token)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository      userRepository;
    private final PatientRepository   patientRepository;
    private final PasswordEncoder     passwordEncoder;
    private final JwtUtil             jwtUtil;
    private final AuthenticationManager authManager;
    private final UserDetailsService  userDetailsService;

    @Value("${jwt.expiry-ms}")
    private long expiryMs;

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Registers a new patient account and creates the linked Patient profile.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "An account with this email already exists.");
        }
        if (request.getPhoneNumber() != null
                && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "An account with this phone number already exists.");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.PATIENT)
                .build();
        user = userRepository.save(user);

        // Create blank patient profile
        Patient patient = Patient.builder().user(user).build();
        patientRepository.save(patient);

        log.info("Registered new patient: {}", user.getEmail());
        return issueTokens(user, true);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    /**
     * Authenticates credentials and issues access + refresh tokens.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        if (!user.getIsActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Your account has been deactivated.");
        }

        log.info("User logged in: {}", user.getEmail());
        return issueTokens(user, true);
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    /**
     * Validates the supplied refresh token, rotates it, and issues a new access token.
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        User user = userRepository.findByRefreshToken(request.getRefreshToken())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED,
                        "Invalid or expired refresh token."));

        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());

        if (jwtUtil.isTokenExpired(request.getRefreshToken())) {
            userRepository.updateRefreshToken(user.getId(), null);
            throw new AppException(HttpStatus.UNAUTHORIZED, "Refresh token has expired. Please log in again.");
        }

        // Rotate: issue new access + refresh
        return issueTokens(user, false);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    /**
     * Revokes the stored refresh token for the given user email.
     */
    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user ->
                userRepository.updateRefreshToken(user.getId(), null));
        log.info("User logged out: {}", email);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private AuthResponse issueTokens(User user, boolean includeRefresh) {
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());

        String accessToken  = jwtUtil.generateAccessToken(details);
        String refreshToken = jwtUtil.generateRefreshToken(details);

        // Persist refresh token (rotation)
        userRepository.updateRefreshToken(user.getId(), refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(includeRefresh ? refreshToken : null)
                .expiresIn(expiryMs / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
