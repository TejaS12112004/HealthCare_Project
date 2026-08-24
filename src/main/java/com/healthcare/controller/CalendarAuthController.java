package com.healthcare.controller;

import com.healthcare.repository.UserRepository;
import com.healthcare.service.GoogleCalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
@Tag(name = "Google Calendar Auth", description = "Endpoints for Google Calendar OAuth integration")
public class CalendarAuthController {

    private final GoogleCalendarService googleCalendarService;
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @GetMapping("/auth-url")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get Google OAuth consent URL")
    public ResponseEntity<Map<String, String>> getAuthUrl(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        String url = googleCalendarService.getAuthorizationUrl(userId);
        return ResponseEntity.ok(Map.of("authUrl", url));
    }

    @GetMapping("/callback")
    @Operation(summary = "Google OAuth callback endpoint")
    public void oauthCallback(@RequestParam("code") String code,
                              @RequestParam("state") String state,
                              HttpServletResponse response) throws IOException {
        
        UUID userId = UUID.fromString(state);
        googleCalendarService.processOAuthCallback(code, userId);
        
        response.sendRedirect(frontendUrl + "/calendar-connected");
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("Authentication is required");
        }
        
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new com.healthcare.exception.ResourceNotFoundException("User", "email", email))
                .getId();
    }
}
