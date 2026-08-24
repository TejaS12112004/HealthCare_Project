package com.healthcare.controller;

import com.healthcare.model.dto.request.PostVisitNotesRequest;
import com.healthcare.repository.UserRepository;
import com.healthcare.service.PostVisitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Post Visit Notes", description = "Endpoints for doctor post-visit operations")
public class PostVisitController {

    private final PostVisitService postVisitService;
    private final UserRepository userRepository;

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Submit post-visit clinical notes")
    public ResponseEntity<Map<String, String>> submitNotes(
            @PathVariable UUID id,
            @Valid @RequestBody PostVisitNotesRequest request,
            Authentication authentication) {
        
        UUID doctorUserId = extractUserId(authentication);
        postVisitService.submitNotes(id, request, doctorUserId);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Notes saved. Patient summary being generated."));
    }

    private UUID extractUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new com.healthcare.exception.ResourceNotFoundException("User", "email", email))
                .getId();
    }
}
