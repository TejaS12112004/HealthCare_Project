package com.healthcare.controller;

import com.healthcare.model.dto.request.CreateDoctorRequest;
import com.healthcare.model.dto.request.CreateSpecialisationRequest;
import com.healthcare.model.dto.request.MarkLeaveRequest;
import com.healthcare.model.dto.request.UpdateDoctorRequest;
import com.healthcare.model.dto.response.*;
import com.healthcare.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Admin-only REST controller — {@code /api/v1/admin/**}.
 * All endpoints require the {@code ADMIN} role.
 *
 * <h3>Doctor endpoints</h3>
 * <pre>
 * POST   /doctors
 * GET    /doctors                  ?page &size &specialisationId
 * GET    /doctors/{id}
 * PUT    /doctors/{id}
 * DELETE /doctors/{id}             (soft delete)
 *
 * POST   /doctors/{id}/leave
 * DELETE /doctors/{id}/leave/{date}
 * GET    /doctors/{id}/leave       ?year &month
 * </pre>
 *
 * <h3>Specialisation endpoints</h3>
 * <pre>
 * POST   /specialisations
 * GET    /specialisations
 * </pre>
 *
 * <h3>User endpoints</h3>
 * <pre>
 * GET    /users
 * PATCH  /users/{id}/activate
 * PATCH  /users/{id}/deactivate
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin", description = "Admin-only management endpoints for doctors, users, and specialisations")
public class AdminController {

    private final AdminService adminService;

    // ═══════════════════════════════════════════════════════════════════════════
    //  DOCTOR CRUD
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/doctors")
    @Operation(summary = "Create a new doctor account",
               description = "Creates User + Doctor profile + working hours in a single transaction. " +
                             "A temporary password is returned once and must be changed by the doctor.")
    public ResponseEntity<DoctorResponse> createDoctor(
            @Valid @RequestBody CreateDoctorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createDoctor(request));
    }

    @GetMapping("/doctors")
    @Operation(summary = "List all doctors (paginated)",
               description = "Optionally filter by specialisationId. Returns full profile including working hours.")
    public ResponseEntity<PageResponse<DoctorResponse>> listDoctors(
            @RequestParam(defaultValue = "0") @Min(0)             int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100)  int size,
            @Parameter(description = "Filter by specialisation UUID (optional)")
            @RequestParam(required = false) UUID specialisationId) {
        return ResponseEntity.ok(adminService.listDoctors(page, size, specialisationId));
    }

    @GetMapping("/doctors/{id}")
    @Operation(summary = "Get a single doctor by UUID")
    public ResponseEntity<DoctorResponse> getDoctorById(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getDoctorById(id));
    }

    @PutMapping("/doctors/{id}")
    @Operation(summary = "Update a doctor's profile",
               description = "Partial update — only non-null fields are changed. " +
                             "Providing workingHours replaces all existing working hours.")
    public ResponseEntity<DoctorResponse> updateDoctor(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDoctorRequest request) {
        return ResponseEntity.ok(adminService.updateDoctor(id, request));
    }

    @DeleteMapping("/doctors/{id}")
    @Operation(summary = "Soft-delete a doctor (deactivate account)",
               description = "Sets user.isActive = false. Does not delete the record.")
    public ResponseEntity<Void> deactivateDoctor(@PathVariable UUID id) {
        adminService.deactivateDoctor(id);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  LEAVE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/doctors/{id}/leave")
    @Operation(summary = "Mark a leave day for a doctor",
               description = "Automatically cancels conflicting CONFIRMED/PENDING appointments " +
                             "and queues CANCELLATION emails in email_logs.")
    public ResponseEntity<LeaveMarkResponse> markLeave(
            @PathVariable UUID id,
            @Valid @RequestBody MarkLeaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.markLeave(id, request));
    }

    @DeleteMapping("/doctors/{id}/leave/{date}")
    @Operation(summary = "Remove a leave day",
               description = "Removes the leave record. Does NOT automatically reinstate cancelled appointments.")
    public ResponseEntity<Void> removeLeave(
            @PathVariable UUID id,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        adminService.removeLeave(id, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/doctors/{id}/leave")
    @Operation(summary = "List leave days for a doctor",
               description = "Returns all leave days in the given month. Defaults to current month if not specified.")
    public ResponseEntity<List<LeaveDayResponse>> getLeaves(
            @PathVariable UUID id,
            @Parameter(description = "Year (e.g. 2024). Defaults to current year.")
            @RequestParam(required = false) Integer year,
            @Parameter(description = "Month 1–12. Defaults to current month.")
            @RequestParam(required = false) @Min(1) @Max(12) Integer month) {
        return ResponseEntity.ok(adminService.getLeaves(id, year, month));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SPECIALISATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/specialisations")
    @Operation(summary = "Create a new medical specialisation")
    public ResponseEntity<SpecialisationResponse> createSpecialisation(
            @Valid @RequestBody CreateSpecialisationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createSpecialisation(request));
    }

    @GetMapping("/specialisations")
    @Operation(summary = "List all specialisations (alphabetical)")
    public ResponseEntity<List<SpecialisationResponse>> listSpecialisations() {
        return ResponseEntity.ok(adminService.listSpecialisations());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/users")
    @Operation(summary = "List all users (paginated)")
    public ResponseEntity<PageResponse<UserResponse>> listUsers(
            @RequestParam(defaultValue = "0") @Min(0)            int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(adminService.listUsers(page, size));
    }

    @PatchMapping("/users/{id}/activate")
    @Operation(summary = "Activate a user account")
    public ResponseEntity<UserResponse> activateUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.toggleUserStatus(id, true));
    }

    @PatchMapping("/users/{id}/deactivate")
    @Operation(summary = "Deactivate a user account")
    public ResponseEntity<UserResponse> deactivateUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.toggleUserStatus(id, false));
    }
}
