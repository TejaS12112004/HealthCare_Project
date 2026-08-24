package com.healthcare.controller;

import com.healthcare.exception.AppException;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.response.PrescriptionResponse;
import com.healthcare.model.entity.MedicationReminder;
import com.healthcare.model.entity.Patient;
import com.healthcare.model.entity.Prescription;
import com.healthcare.repository.MedicationReminderRepository;
import com.healthcare.repository.PatientRepository;
import com.healthcare.repository.PrescriptionRepository;
import com.healthcare.repository.UserRepository;
import com.healthcare.service.MedicationReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescriptions", description = "Patient prescription and reminder management")
public class PrescriptionController {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final MedicationReminderService medicationReminderService;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    /**
     * GET /api/v1/prescriptions/my
     * Returns the authenticated patient's active prescriptions with their reminder times
     * converted back to the patient's local timezone for display.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get my active prescriptions with reminder times")
    public ResponseEntity<List<PrescriptionResponse>> getMyPrescriptions(Authentication authentication) {
        Patient patient = resolvePatient(authentication);
        ZoneId patientZone = ZoneId.of(
                patient.getTimezone() != null ? patient.getTimezone() : "Asia/Kolkata");

        List<Prescription> prescriptions = prescriptionRepository.findActiveForPatient(
                patient.getId(), LocalDate.now());

        List<PrescriptionResponse> response = prescriptions.stream()
                .map(rx -> toResponse(rx, patient.getId(), patientZone))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/prescriptions/{prescriptionId}/reminders
     * Patient can cancel all reminders for one of their prescriptions.
     */
    @DeleteMapping("/{prescriptionId}/reminders")
    @PreAuthorize("hasRole('PATIENT')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Cancel all reminders for a prescription")
    public ResponseEntity<Void> cancelReminders(@PathVariable UUID prescriptionId,
                                                Authentication authentication) {
        Patient patient = resolvePatient(authentication);

        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", prescriptionId));

        // Ensure the prescription belongs to this patient
        if (!prescription.getAppointment().getPatient().getId().equals(patient.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Not authorized to cancel reminders for this prescription.");
        }

        medicationReminderService.cancelReminders(prescriptionId);
        return ResponseEntity.noContent().build();
    }

    // ──────────────────────────── helpers ────────────────────────────

    private Patient resolvePatient(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .flatMap(user -> patientRepository.findByUserId(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "email", email));
    }

    private PrescriptionResponse toResponse(Prescription rx, UUID patientId, ZoneId patientZone) {
        List<MedicationReminder> reminders = medicationReminderRepository
                .findByPrescriptionId(rx.getId())
                .stream()
                .filter(MedicationReminder::getIsActive)
                .collect(Collectors.toList());

        // Convert stored UTC times back to patient local time for display
        List<LocalTime> localTimes = reminders.stream()
                .map(r -> {
                    ZonedDateTime utcZdt = ZonedDateTime.now(ZoneId.of("UTC")).with(r.getScheduledTime());
                    return utcZdt.withZoneSameInstant(patientZone).toLocalTime();
                })
                .sorted()
                .collect(Collectors.toList());

        return PrescriptionResponse.builder()
                .id(rx.getId())
                .medicationName(rx.getMedicationName())
                .dosage(rx.getDosage())
                .frequency(rx.getFrequency())
                .durationDays(rx.getDurationDays())
                .startDate(rx.getStartDate())
                .endDate(rx.getEndDate())
                .instructions(rx.getInstructions())
                .reminderTimesLocal(localTimes)
                .build();
    }
}
