package com.healthcare.config;

import com.healthcare.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.security.JwtFilter;
import com.healthcare.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.time.LocalDateTime;

/**
 * Spring Security configuration — stateless JWT, role-protected routes, and
 * structured JSON 401/403 error responses.
 *
 * <h3>Public (no token required)</h3>
 * <ul>
 *   <li>POST {@code /api/v1/auth/register}</li>
 *   <li>POST {@code /api/v1/auth/login}</li>
 *   <li>GET  {@code /api/v1/auth/refresh}</li>
 *   <li>GET  {@code /api/v1/doctors}  (public doctor search)</li>
 *   <li>GET  {@code /swagger-ui/**}, {@code /v3/api-docs/**}</li>
 *   <li>GET  {@code /actuator/health}</li>
 * </ul>
 *
 * <h3>Method-level security</h3>
 * Enabled via {@link EnableMethodSecurity} — controllers may use {@code @PreAuthorize}.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter              jwtFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final ObjectMapper           objectMapper;

    // ── Public route patterns ─────────────────────────────────────────────────

    private static final String[] PUBLIC_POST = {
            "/api/v1/auth/register",
            "/api/v1/auth/login"
    };

    private static final String[] PUBLIC_GET = {
            "/api/v1/auth/refresh",
            "/api/v1/doctors",          // public doctor listing/search
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/api-docs/**",
            "/actuator/health"
    };

    // ── Security filter chain ─────────────────────────────────────────────────

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, PUBLIC_POST).permitAll()
                .requestMatchers(HttpMethod.GET,  PUBLIC_GET).permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/doctor/**").hasAnyRole("DOCTOR", "ADMIN")
                .requestMatchers("/api/v1/patient/**").hasAnyRole("PATIENT", "ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                // 401 — missing / invalid token
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(response.getOutputStream(),
                            buildError(HttpStatus.UNAUTHORIZED,
                                    "Authentication required. Please provide a valid Bearer token."));
                })
                // 403 — authenticated but insufficient role
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(response.getOutputStream(),
                            buildError(HttpStatus.FORBIDDEN,
                                    "You do not have permission to access this resource."));
                })
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ── Auth beans ────────────────────────────────────────────────────────────

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private ErrorResponse buildError(HttpStatus status, String message) {
        return ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
