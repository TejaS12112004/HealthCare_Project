package com.healthcare.service;

import com.healthcare.exception.AppException;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.request.PostVisitNotesRequest;
import com.healthcare.model.dto.request.PrescriptionDto;
import com.healthcare.model.entity.*;
import com.healthcare.model.enums.LlmStatus;
import com.healthcare.model.enums.ReminderFrequency;
import com.healthcare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostVisitService {

    private final AppointmentRepository appointmentRepository;
    private final PostVisitNoteRepository postVisitNoteRepository;
    private final PostVisitSummaryRepository postVisitSummaryRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final UserRepository userRepository;
    private final LlmService llmService;

    @Transactional
    public void submitNotes(UUID appointmentId, PostVisitNotesRequest request, UUID doctorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (!appointment.getDoctor().getUser().getId().equals(doctorUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Not authorized to submit notes for this appointment.");
        }
        
        if (postVisitNoteRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Post-visit notes have already been submitted for this appointment.");
        }

        User doctorUser = userRepository.findById(doctorUserId).orElseThrow();

        // 1. Save Notes
        PostVisitNote note = PostVisitNote.builder()
                .appointment(appointment)
                .clinicalNotes(request.getClinicalNotes())
                .submittedBy(doctorUser)
                .build();
        postVisitNoteRepository.save(note);

        // 2. Save Prescriptions & Reminders
        Patient patient = appointment.getPatient();
        ZoneId patientZone = ZoneId.of(patient.getTimezone() != null ? patient.getTimezone() : "Asia/Kolkata");

        if (request.getPrescriptions() != null) {
            for (PrescriptionDto pDto : request.getPrescriptions()) {
                Prescription prescription = Prescription.builder()
                        .appointment(appointment)
                        .medicationName(pDto.getMedicationName())
                        .dosage(pDto.getDosage())
                        .frequency(pDto.getFrequency())
                        .durationDays(pDto.getDurationDays())
                        .startDate(pDto.getStartDate())
                        .instructions(pDto.getInstructions())
                        .build();
                prescription = prescriptionRepository.save(prescription);

                createReminders(prescription, patient, patientZone);
            }
        }

        // 3. Create Pending Summary
        PostVisitSummary summary = PostVisitSummary.builder()
                .appointment(appointment)
                .llmStatus(LlmStatus.PENDING)
                .build();
        postVisitSummaryRepository.save(summary);

        // 4. Trigger Async LLM Generation
        llmService.generatePostVisitSummary(appointmentId);
    }

    private void createReminders(Prescription prescription, Patient patient, ZoneId patientZone) {
        List<LocalTime> localTimes = getLocalTimesForFrequency(prescription.getFrequency());

        for (LocalTime localTime : localTimes) {
            // Option A: Store the UTC time in MedicationReminder
            // To get the UTC time for a given local time, we map today's local time to UTC.
            // Since it's a recurring daily event, the local time mapped to UTC might shift if DST occurs.
            // However, following the instructions "Store UTC time in medication_reminders.scheduled_time":
            ZonedDateTime zdt = ZonedDateTime.now(patientZone).with(localTime);
            LocalTime utcTime = zdt.withZoneSameInstant(ZoneId.of("UTC")).toLocalTime();

            MedicationReminder reminder = MedicationReminder.builder()
                    .prescription(prescription)
                    .patient(patient)
                    .scheduledTime(utcTime)
                    .isActive(true)
                    .build();
            medicationReminderRepository.save(reminder);
        }
    }

    private List<LocalTime> getLocalTimesForFrequency(ReminderFrequency frequency) {
        List<LocalTime> times = new ArrayList<>();
        switch (frequency) {
            case ONCE_DAILY:
                times.add(LocalTime.of(9, 0));
                break;
            case TWICE_DAILY:
                times.add(LocalTime.of(9, 0));
                times.add(LocalTime.of(21, 0));
                break;
            case THRICE_DAILY:
                times.add(LocalTime.of(9, 0));
                times.add(LocalTime.of(14, 0));
                times.add(LocalTime.of(21, 0));
                break;
        }
        return times;
    }
}
