package com.healthcare.controller;

import com.healthcare.model.entity.PostVisitSummary;
import com.healthcare.model.entity.PreVisitSummary;
import com.healthcare.model.enums.LlmStatus;
import com.healthcare.repository.PostVisitSummaryRepository;
import com.healthcare.repository.PreVisitSummaryRepository;
import com.healthcare.service.LlmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/llm")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "LLM Admin", description = "Endpoints for admin to manage and retry LLM tasks")
@PreAuthorize("hasRole('ADMIN')")
public class LlmRetryAdminController {

    private final LlmService llmService;
    private final PreVisitSummaryRepository preVisitSummaryRepository;
    private final PostVisitSummaryRepository postVisitSummaryRepository;

    @PostMapping("/retry/pre-visit/{appointmentId}")
    @Operation(summary = "Manually retry a failed pre-visit summary")
    public ResponseEntity<Map<String, String>> retryPreVisit(@PathVariable UUID appointmentId) {
        llmService.generatePreVisitSummary(appointmentId);
        return ResponseEntity.ok(Map.of("message", "Pre-visit summary retry triggered"));
    }

    @PostMapping("/retry/post-visit/{appointmentId}")
    @Operation(summary = "Manually retry a failed post-visit summary")
    public ResponseEntity<Map<String, String>> retryPostVisit(@PathVariable UUID appointmentId) {
        llmService.generatePostVisitSummary(appointmentId);
        return ResponseEntity.ok(Map.of("message", "Post-visit summary retry triggered"));
    }

    @GetMapping("/failed")
    @Operation(summary = "List all appointments with failed LLM tasks")
    public ResponseEntity<Map<String, List<UUID>>> listFailedSummaries() {
        List<UUID> failedPreVisits = preVisitSummaryRepository.findByLlmStatusAndRetryCountLessThan(LlmStatus.FAILED, Integer.MAX_VALUE)
                .stream().map(s -> s.getAppointment().getId()).collect(Collectors.toList());
        
        List<UUID> failedPostVisits = postVisitSummaryRepository.findByLlmStatusAndRetryCountLessThan(LlmStatus.FAILED, Integer.MAX_VALUE)
                .stream().map(s -> s.getAppointment().getId()).collect(Collectors.toList());

        Map<String, List<UUID>> response = new HashMap<>();
        response.put("failedPreVisits", failedPreVisits);
        response.put("failedPostVisits", failedPostVisits);
        return ResponseEntity.ok(response);
    }
}
