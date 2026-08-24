package com.healthcare.controller;

import com.healthcare.model.dto.request.CreateDoctorRequest;
import com.healthcare.model.dto.response.DoctorResponse;
import com.healthcare.model.dto.response.PageResponse;
import com.healthcare.model.dto.response.UserResponse;
import com.healthcare.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin-only management endpoints for users and doctors")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/doctors")
    @Operation(summary = "Create a new doctor account")
    public ResponseEntity<DoctorResponse> createDoctor(
            @Valid @RequestBody CreateDoctorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createDoctor(request));
    }

    @GetMapping("/doctors")
    @Operation(summary = "List all doctors (paginated)")
    public ResponseEntity<PageResponse<DoctorResponse>> listDoctors(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(adminService.listDoctors(page, size));
    }

    @GetMapping("/doctors/{id}")
    @Operation(summary = "Get a doctor by UUID")
    public ResponseEntity<DoctorResponse> getDoctor(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getDoctorById(id));
    }

    @GetMapping("/users")
    @Operation(summary = "List all users (paginated)")
    public ResponseEntity<PageResponse<UserResponse>> listUsers(
            @RequestParam(defaultValue = "0") @Min(0) int page,
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
