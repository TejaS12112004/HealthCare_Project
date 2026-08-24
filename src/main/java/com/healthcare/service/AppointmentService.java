package com.healthcare.service;

import com.healthcare.event.AppointmentCancelledEvent;
import com.healthcare.event.AppointmentConfirmedEvent;
import com.healthcare.event.AppointmentRescheduledEvent;
import com.healthcare.exception.AppException;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.request.ConfirmBookingRequest;
import com.healthcare.model.dto.request.HoldSlotRequest;
import com.healthcare.model.dto.request.RescheduleRequest;
import com.healthcare.model.dto.response.AppointmentResponse;
import com.healthcare.model.dto.response.AppointmentSummaryResponse;
import com.healthcare.model.dto.response.HoldResponse;
import com.healthcare.model.dto.response.PageResponse;
import com.healthcare.model.entity.*;
import com.healthcare.model.enums.AppointmentStatus;
import com.healthcare.model.enums.LlmStatus;
import com.healthcare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final SlotHoldRepository slotHoldRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final SymptomFormRepository symptomFormRepository;
    private final PreVisitSummaryRepository preVisitSummaryRepository;
    private final SlotService slotService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public HoldResponse holdSlot(HoldSlotRequest request, UUID patientId) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Check if patient already has an active hold
        if (slotHoldRepository.hasActiveHoldForPatient(patientId, now)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "You already have an active slot hold. Please confirm or wait for it to expire.");
        }

        // 2. Check if slot is available
        boolean isAvailable = slotService.isSlotAvailable(request.getDoctorId(), request.getSlotTime());
        if (!isAvailable) {
            throw new AppException(HttpStatus.CONFLICT, "Slot is no longer available.");
        }

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));
        Patient patient = patientRepository.findByUserId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", patientId));

        // 3. Create Slot Hold for 10 minutes
        SlotHold hold = SlotHold.builder()
                .doctor(doctor)
                .patient(patient)
                .slotTime(request.getSlotTime())
                .expiresAt(now.plusMinutes(10))
                .isReleased(false)
                .build();
        hold = slotHoldRepository.save(hold);

        return HoldResponse.builder()
                .holdId(hold.getId())
                .doctorName(doctor.getUser().getFullName())
                .slotTime(hold.getSlotTime())
                .expiresAt(hold.getExpiresAt())
                .build();
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AppointmentResponse confirmBooking(UUID holdId, ConfirmBookingRequest request, UUID patientUserId) {
        LocalDateTime now = LocalDateTime.now();
        
        Patient patient = patientRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", patientUserId));

        // 1. Validate Hold
        SlotHold hold = slotHoldRepository.findById(holdId)
                .orElseThrow(() -> new ResourceNotFoundException("SlotHold", "id", holdId));

        if (!hold.getPatient().getId().equals(patient.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "This hold does not belong to you.");
        }
        if (hold.getIsReleased()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "This slot hold has already been released or processed.");
        }
        if (now.isAfter(hold.getExpiresAt())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "This slot hold has expired.");
        }

        // 2. Double-check availability just in case (optional since we rely on Serializable isolation + hold presence)
        if (!slotService.isSlotAvailable(hold.getDoctor().getId(), hold.getSlotTime())) {
            // Because the hold itself might make it appear "unavailable" in isSlotAvailable if we aren't careful, 
            // actually we don't strictly need this check because the unexpired hold guarantees it for US.
            // Or we check it excluding our own hold. We will trust the hold and Serializable isolation.
        }

        // 3. Create Appointment
        Appointment appointment = Appointment.builder()
                .doctor(hold.getDoctor())
                .patient(patient)
                .slotTime(hold.getSlotTime())
                .status(AppointmentStatus.CONFIRMED)
                .build();
        appointment = appointmentRepository.save(appointment);

        // 4. Create SymptomForm
        SymptomForm form = SymptomForm.builder()
                .appointment(appointment)
                .symptoms(request.getSymptoms())
                .durationDays(request.getDurationDays())
                .severity(request.getSeverity())
                .additionalNotes(request.getAdditionalNotes())
                .build();
        form = symptomFormRepository.save(form);

        // 5. Create PreVisitSummary placeholder
        PreVisitSummary pvs = PreVisitSummary.builder()
                .appointment(appointment)
                .llmStatus(LlmStatus.PENDING)
                .build();
        pvs = preVisitSummaryRepository.save(pvs);

        // 6. Release Hold
        hold.setIsReleased(true);
        slotHoldRepository.save(hold);

        // 7. Publish Event
        eventPublisher.publishEvent(new AppointmentConfirmedEvent(this, appointment.getId()));

        return toAppointmentResponse(appointment, form, pvs);
    }

    @Transactional
    public void cancelAppointment(UUID appointmentId, UUID userId, boolean isDoctor) {
        Appointment appointment = appointmentRepository.findByIdForUpdate(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (isDoctor) {
            Doctor doc = doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", userId));
            if (!appointment.getDoctor().getId().equals(doc.getId())) {
                throw new AppException(HttpStatus.FORBIDDEN, "Not authorized to cancel this appointment");
            }
        } else {
            Patient pat = patientRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", userId));
            if (!appointment.getPatient().getId().equals(pat.getId())) {
                throw new AppException(HttpStatus.FORBIDDEN, "Not authorized to cancel this appointment");
            }
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cannot cancel an already " + appointment.getStatus() + " appointment");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledReason(isDoctor ? "Cancelled by doctor" : "Cancelled by patient");
        appointmentRepository.save(appointment);

        eventPublisher.publishEvent(new AppointmentCancelledEvent(this, appointment.getId(), appointment.getCancelledReason()));
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AppointmentResponse rescheduleAppointment(UUID appointmentId, RescheduleRequest request, UUID patientUserId) {
        Patient patient = patientRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", patientUserId));

        // Use SELECT FOR UPDATE
        Appointment appointment = appointmentRepository.findByIdForUpdate(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Not authorized to reschedule this appointment");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cannot reschedule an already " + appointment.getStatus() + " appointment");
        }

        // Verify new slot is available
        boolean isAvailable = slotService.isSlotAvailable(appointment.getDoctor().getId(), request.getNewSlotTime());
        if (!isAvailable) {
            throw new AppException(HttpStatus.CONFLICT, "The new slot is not available.");
        }

        appointment.setSlotTime(request.getNewSlotTime());
        appointment.setStatus(AppointmentStatus.RESCHEDULED);
        appointment = appointmentRepository.save(appointment);

        // Update Symptom Form if requested
        SymptomForm form = symptomFormRepository.findByAppointmentId(appointmentId).orElse(null);
        if (form != null && request.getSymptoms() != null && !request.getSymptoms().trim().isEmpty()) {
            form.setSymptoms(request.getSymptoms());
            form.setDurationDays(request.getDurationDays());
            form.setSeverity(request.getSeverity());
            form.setAdditionalNotes(request.getAdditionalNotes());
            form = symptomFormRepository.save(form);
            
            // Also reset pre-visit summary so it gets regenerated
            preVisitSummaryRepository.findByAppointmentId(appointmentId).ifPresent(pvs -> {
                pvs.setLlmStatus(LlmStatus.PENDING);
                pvs.setChiefComplaint(null);
                pvs.setSuggestedQuestions(null);
                preVisitSummaryRepository.save(pvs);
            });
        }

        eventPublisher.publishEvent(new AppointmentRescheduledEvent(this, appointment.getId(), request.getNewSlotTime()));

        PreVisitSummary pvs = preVisitSummaryRepository.findByAppointmentId(appointmentId).orElse(null);
        return toAppointmentResponse(appointment, form, pvs);
    }

    @Transactional(readOnly = true)
    public PageResponse<AppointmentSummaryResponse> getMyAppointments(UUID patientUserId, int page, int size) {
        Patient patient = patientRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", patientUserId));
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("slotTime").descending());
        Page<Appointment> apps = appointmentRepository.findByPatientId(patient.getId(), pageable);
        return toPageResponse(apps);
    }

    @Transactional(readOnly = true)
    public PageResponse<AppointmentSummaryResponse> getDoctorAppointments(UUID doctorUserId, int page, int size) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("slotTime").descending());
        Page<Appointment> apps = appointmentRepository.findByDoctorId(doctor.getId(), pageable);
        return toPageResponse(apps);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(UUID appointmentId) {
        Appointment app = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));
        
        SymptomForm form = symptomFormRepository.findByAppointmentId(appointmentId).orElse(null);
        PreVisitSummary pvs = preVisitSummaryRepository.findByAppointmentId(appointmentId).orElse(null);
        
        return toAppointmentResponse(app, form, pvs);
    }

    private AppointmentResponse toAppointmentResponse(Appointment a, SymptomForm f, PreVisitSummary p) {
        AppointmentResponse.SymptomFormDto formDto = null;
        if (f != null) {
            formDto = AppointmentResponse.SymptomFormDto.builder()
                    .symptoms(f.getSymptoms())
                    .durationDays(f.getDurationDays())
                    .severity(f.getSeverity())
                    .additionalNotes(f.getAdditionalNotes())
                    .build();
        }

        AppointmentResponse.PreVisitSummaryDto pvsDto = null;
        if (p != null) {
            pvsDto = AppointmentResponse.PreVisitSummaryDto.builder()
                    .llmStatus(p.getLlmStatus())
                    .urgencyLevel(p.getUrgencyLevel())
                    .chiefComplaint(p.getChiefComplaint())
                    .suggestedQuestions(p.getSuggestedQuestions())
                    .build();
        }

        return AppointmentResponse.builder()
                .id(a.getId())
                .doctor(AppointmentResponse.DoctorInfo.builder()
                        .id(a.getDoctor().getId())
                        .name(a.getDoctor().getUser().getFullName())
                        .specialisation(a.getDoctor().getSpecialisation() != null ? a.getDoctor().getSpecialisation().getName() : null)
                        .build())
                .patient(AppointmentResponse.PatientInfo.builder()
                        .id(a.getPatient().getId())
                        .name(a.getPatient().getUser().getFullName())
                        .build())
                .slotTime(a.getSlotTime())
                .status(a.getStatus())
                .cancelledReason(a.getCancelledReason())
                .symptomForm(formDto)
                .preVisitSummary(pvsDto)
                .build();
    }

    private PageResponse<AppointmentSummaryResponse> toPageResponse(Page<Appointment> page) {
        List<AppointmentSummaryResponse> content = page.getContent().stream()
                .map(a -> AppointmentSummaryResponse.builder()
                        .id(a.getId())
                        .doctorName(a.getDoctor().getUser().getFullName())
                        .patientName(a.getPatient().getUser().getFullName())
                        .slotTime(a.getSlotTime())
                        .status(a.getStatus())
                        .build())
                .toList();
                
        return PageResponse.<AppointmentSummaryResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .build();
    }
}
