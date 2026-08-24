package com.healthcare.controller;

import com.healthcare.model.dto.request.ConfirmBookingRequest;
import com.healthcare.model.dto.request.HoldSlotRequest;
import com.healthcare.model.dto.request.RescheduleRequest;
import com.healthcare.model.dto.response.AppointmentResponse;
import com.healthcare.model.dto.response.AppointmentSummaryResponse;
import com.healthcare.model.dto.response.HoldResponse;
import com.healthcare.model.dto.response.PageResponse;
import com.healthcare.repository.UserRepository;
import com.healthcare.security.JwtUtil;
import com.healthcare.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Appointments", description = "Appointment booking and management endpoints")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

    @PostMapping("/hold")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Step 1: Hold a slot", description = "Places a 10-minute hold on a slot to prevent concurrent bookings.")
    public ResponseEntity<HoldResponse> holdSlot(
            @Valid @RequestBody HoldSlotRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.holdSlot(request, userId));
    }

    @PostMapping("/{holdId}/confirm")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Step 2: Confirm booking", description = "Submits symptom form and confirms the appointment.")
    public ResponseEntity<AppointmentResponse> confirmBooking(
            @PathVariable UUID holdId,
            @Valid @RequestBody ConfirmBookingRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.confirmBooking(holdId, request, userId));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<Void> cancelAppointment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        boolean isDoctor = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_DOCTOR"));
        appointmentService.cancelAppointment(id, userId, isDoctor);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reschedule")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Reschedule an appointment")
    public ResponseEntity<AppointmentResponse> rescheduleAppointment(
            @PathVariable UUID id,
            @Valid @RequestBody RescheduleRequest request,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, request, userId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get current patient's appointments")
    public ResponseEntity<PageResponse<AppointmentResponse>> getMyAppointments(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(appointmentService.getMyAppointments(userId, page, size));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Get current doctor's appointments")
    public ResponseEntity<PageResponse<AppointmentResponse>> getDoctorAppointments(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(userId, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @Operation(summary = "Get appointment by ID")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    private UUID extractUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new com.healthcare.exception.ResourceNotFoundException("User", "email", email))
                .getId();
    }
}
