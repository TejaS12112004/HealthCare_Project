package com.healthcare.controller;

import com.healthcare.model.dto.response.DoctorAvailabilityResponse;
import com.healthcare.model.dto.response.PageResponse;
import com.healthcare.model.dto.response.SlotResponse;
import com.healthcare.service.DoctorService;
import com.healthcare.service.SlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Public endpoints for doctor discovery and slot availability.
 * No authentication is required to view doctors or slots.
 */
@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors (Public)", description = "Public doctor search and slot availability endpoints")
public class DoctorController {

    private final DoctorService doctorService;
    private final SlotService slotService;

    @GetMapping
    @Operation(summary = "Search for doctors and check availability",
               description = "Returns a paginated list of doctors. If a date is provided, returns available slots for that date. Otherwise, returns the next available date.")
    public ResponseEntity<PageResponse<DoctorAvailabilityResponse>> searchDoctors(
            @Parameter(description = "Filter by specialisation name (e.g. 'Cardiologist')")
            @RequestParam(required = false) String specialisation,
            @Parameter(description = "Check availability for a specific date (YYYY-MM-DD)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(doctorService.searchDoctors(specialisation, date, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get doctor profile and availability by ID")
    public ResponseEntity<DoctorAvailabilityResponse> getDoctorProfile(
            @PathVariable UUID id,
            @Parameter(description = "Check availability for a specific date (YYYY-MM-DD)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(doctorService.getDoctorProfile(id, date));
    }

    @GetMapping("/{id}/slots")
    @Operation(summary = "Get full slot schedule for a given date",
               description = "Returns a list of all theoretically possible slots for the given date, marking each as available or unavailable.")
    public ResponseEntity<List<SlotResponse>> getDoctorSlots(
            @PathVariable UUID id,
            @Parameter(description = "Date to check slots for (YYYY-MM-DD)", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(slotService.getAvailableSlots(id, date));
    }
}
