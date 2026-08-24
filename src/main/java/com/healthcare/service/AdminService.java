package com.healthcare.service;

import com.healthcare.exception.AppException;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.request.CreateDoctorRequest;
import com.healthcare.model.dto.request.CreateSpecialisationRequest;
import com.healthcare.model.dto.request.MarkLeaveRequest;
import com.healthcare.model.dto.request.UpdateDoctorRequest;
import com.healthcare.model.dto.request.WorkingHoursDto;
import com.healthcare.model.dto.response.*;
import com.healthcare.model.entity.*;
import com.healthcare.model.enums.AppointmentStatus;
import com.healthcare.model.enums.EmailStatus;
import com.healthcare.model.enums.EmailType;
import com.healthcare.model.enums.Role;
import com.healthcare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Admin business logic — doctor lifecycle, working hours, leave days,
 * specialisations, and appointment cancellation on conflict.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository                userRepository;
    private final DoctorRepository              doctorRepository;
    private final DoctorWorkingHoursRepository  workingHoursRepository;
    private final DoctorLeaveDayRepository      leaveDayRepository;
    private final SpecialisationRepository      specialisationRepository;
    private final AppointmentRepository         appointmentRepository;
    private final EmailLogRepository            emailLogRepository;
    private final PasswordEncoder               passwordEncoder;

    // ═══════════════════════════════════════════════════════════════════════════
    //  DOCTOR CRUD
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Creates a User (DOCTOR role), Doctor profile, and DoctorWorkingHours entries
     * in a single atomic transaction.
     * A random 12-character temporary password is generated and returned once in the response.
     */
    @Transactional
    public DoctorResponse createDoctor(CreateDoctorRequest request) {

        // ── Validation ────────────────────────────────────────────────────────
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(HttpStatus.CONFLICT, "Email already in use.");
        }
        if (request.getPhone() != null
                && userRepository.existsByPhoneNumber(request.getPhone())) {
            throw new AppException(HttpStatus.CONFLICT, "Phone number already registered.");
        }

        // ── Generate temporary password ───────────────────────────────────────
        String tempPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        log.info("Creating doctor account for {} — temp password generated (not logged for security)",
                request.getEmail());

        // ── Create User ───────────────────────────────────────────────────────
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(tempPassword))
                .phoneNumber(request.getPhone())
                .role(Role.DOCTOR)
                .build();
        user = userRepository.save(user);

        // ── Resolve specialisation ────────────────────────────────────────────
        Specialisation specialisation = null;
        if (request.getSpecialisationId() != null) {
            specialisation = specialisationRepository.findById(request.getSpecialisationId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Specialisation", "id", request.getSpecialisationId()));
        }

        // ── Create Doctor profile ─────────────────────────────────────────────
        Doctor doctor = Doctor.builder()
                .user(user)
                .specialisation(specialisation)
                .bio(request.getBio())
                .slotDurationMinutes(
                        request.getSlotDurationMinutes() != null ? request.getSlotDurationMinutes() : 30)
                .build();
        doctor = doctorRepository.save(doctor);

        // ── Create working hours ──────────────────────────────────────────────
        List<DoctorWorkingHours> savedHours = new ArrayList<>();
        if (request.getWorkingHours() != null) {
            savedHours = saveWorkingHours(doctor, request.getWorkingHours());
        }

        log.info("Doctor created: {} ({})", user.getEmail(), doctor.getId());
        return toDoctorResponse(doctor, savedHours, tempPassword);
    }

    /**
     * Returns a paginated list of all doctors.
     * Optionally filters by {@code specialisationId}.
     */
    @Transactional(readOnly = true)
    public PageResponse<DoctorResponse> listDoctors(int page, int size, UUID specialisationId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Doctor> doctorPage = (specialisationId != null)
                ? doctorRepository.findBySpecialisationId(specialisationId, pageable)
                : doctorRepository.findAll(pageable);

        return toPageResponse(doctorPage.map(d ->
                toDoctorResponse(d, workingHoursRepository.findByDoctorIdOrderByDayOfWeek(d.getId()), null)));
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(UUID id) {
        Doctor doctor = findDoctor(id);
        List<DoctorWorkingHours> hours = workingHoursRepository.findByDoctorIdOrderByDayOfWeek(id);
        return toDoctorResponse(doctor, hours, null);
    }

    /**
     * Partial update — only non-null fields are applied.
     * If {@code workingHours} is provided, all existing hours are replaced.
     */
    @Transactional
    public DoctorResponse updateDoctor(UUID id, UpdateDoctorRequest request) {
        Doctor doctor = findDoctor(id);

        if (StringUtils.hasText(request.getBio())) {
            doctor.setBio(request.getBio());
        }
        if (request.getSlotDurationMinutes() != null) {
            doctor.setSlotDurationMinutes(request.getSlotDurationMinutes());
        }
        if (request.getConsultationFee() != null) {
            doctor.setConsultationFee(request.getConsultationFee());
        }
        if (request.getIsAvailable() != null) {
            doctor.setIsAvailable(request.getIsAvailable());
        }
        if (request.getSpecialisationId() != null) {
            Specialisation spec = specialisationRepository.findById(request.getSpecialisationId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Specialisation", "id", request.getSpecialisationId()));
            doctor.setSpecialisation(spec);
        }

        doctor = doctorRepository.save(doctor);

        // Replace working hours only if explicitly provided
        List<DoctorWorkingHours> hours;
        if (request.getWorkingHours() != null) {
            workingHoursRepository.deleteAllByDoctorId(id);
            hours = saveWorkingHours(doctor, request.getWorkingHours());
        } else {
            hours = workingHoursRepository.findByDoctorIdOrderByDayOfWeek(id);
        }

        log.info("Doctor updated: {}", id);
        return toDoctorResponse(doctor, hours, null);
    }

    /**
     * Soft-deletes a doctor by setting the associated user's {@code isActive = false}.
     */
    @Transactional
    public void deactivateDoctor(UUID id) {
        Doctor doctor = findDoctor(id);
        userRepository.updateActiveStatus(doctor.getUser().getId(), false);
        log.info("Doctor deactivated (soft delete): {}", id);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  LEAVE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Marks a doctor leave day. For each appointment that conflicts with the leave:
     * <ol>
     *   <li>Sets appointment status to CANCELLED.</li>
     *   <li>Queues a CANCELLATION email in email_logs (picked up by notification job).</li>
     * </ol>
     */
    @Transactional
    public LeaveMarkResponse markLeave(UUID doctorId, MarkLeaveRequest request) {
        Doctor doctor = findDoctor(doctorId);

        // Prevent duplicate leave entries
        if (leaveDayRepository.existsByDoctorIdAndLeaveDate(doctorId, request.getLeaveDate())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "A leave day already exists for " + request.getLeaveDate());
        }

        // Save leave record
        DoctorLeaveDay leaveDay = DoctorLeaveDay.builder()
                .doctor(doctor)
                .leaveDate(request.getLeaveDate())
                .reason(request.getReason())
                .build();
        leaveDayRepository.save(leaveDay);

        // Find conflicting appointments (CONFIRMED or PENDING on that day)
        LocalDateTime startOfDay = request.getLeaveDate().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);

        List<Appointment> conflicts = appointmentRepository.findConflictingOnDate(
                doctorId, startOfDay, endOfDay,
                List.of(AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING));

        // Cancel them and queue cancellation emails
        List<AppointmentSummaryDto> summaries = new ArrayList<>();
        int emailsQueued = 0;

        if (!conflicts.isEmpty()) {
            List<UUID> conflictIds = conflicts.stream().map(Appointment::getId).toList();
            appointmentRepository.bulkUpdateStatus(
                    conflictIds,
                    AppointmentStatus.CANCELLED,
                    "Doctor on leave on " + request.getLeaveDate());

            for (Appointment appt : conflicts) {
                User patient = appt.getPatient().getUser();

                // Queue cancellation email
                emailLogRepository.save(EmailLog.builder()
                        .recipientEmail(patient.getEmail())
                        .subject("Your appointment on " + request.getLeaveDate() + " has been cancelled")
                        .emailType(EmailType.CANCELLATION)
                        .appointment(appt)
                        .status(EmailStatus.PENDING)
                        .build());
                emailsQueued++;

                summaries.add(AppointmentSummaryDto.builder()
                        .id(appt.getId())
                        .patientId(appt.getPatient().getId())
                        .patientName(patient.getFullName())
                        .patientEmail(patient.getEmail())
                        .slotTime(appt.getSlotTime())
                        .status(AppointmentStatus.CANCELLED)
                        .build());
            }
        }

        log.info("Leave marked for doctor {} on {} — {} appointments cancelled, {} emails queued",
                doctorId, request.getLeaveDate(), summaries.size(), emailsQueued);

        return LeaveMarkResponse.builder()
                .leaveSaved(true)
                .leaveDate(request.getLeaveDate())
                .affectedAppointments(summaries)
                .emailsQueued(emailsQueued)
                .build();
    }

    /**
     * Removes a leave day. Does NOT reinstate cancelled appointments.
     *
     * @return {@code true} if a leave record was found and deleted
     */
    @Transactional
    public boolean removeLeave(UUID doctorId, LocalDate leaveDate) {
        findDoctor(doctorId); // validate doctor exists

        int deleted = leaveDayRepository.deleteByDoctorIdAndLeaveDate(doctorId, leaveDate);
        if (deleted == 0) {
            throw new ResourceNotFoundException("LeaveDay", "date", leaveDate);
        }
        log.info("Leave removed for doctor {} on {}", doctorId, leaveDate);
        return true;
    }

    /**
     * Returns all leave days for a doctor in the given month/year.
     * If {@code year} or {@code month} is null, defaults to the current month.
     */
    @Transactional(readOnly = true)
    public List<LeaveDayResponse> getLeaves(UUID doctorId, Integer year, Integer month) {
        findDoctor(doctorId);

        LocalDate now   = LocalDate.now();
        int targetYear  = (year  != null) ? year  : now.getYear();
        int targetMonth = (month != null) ? month : now.getMonthValue();

        LocalDate from = LocalDate.of(targetYear, targetMonth, 1);
        LocalDate to   = from.withDayOfMonth(from.lengthOfMonth());

        return leaveDayRepository
                .findByDoctorIdAndLeaveDateBetweenOrderByLeaveDate(doctorId, from, to)
                .stream()
                .map(l -> LeaveDayResponse.builder()
                        .id(l.getId())
                        .leaveDate(l.getLeaveDate())
                        .reason(l.getReason())
                        .build())
                .toList();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SPECIALISATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public SpecialisationResponse createSpecialisation(CreateSpecialisationRequest request) {
        if (specialisationRepository.existsByNameIgnoreCase(request.getName())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Specialisation '" + request.getName() + "' already exists.");
        }
        Specialisation spec = specialisationRepository.save(
                Specialisation.builder().name(request.getName()).build());
        return SpecialisationResponse.builder().id(spec.getId()).name(spec.getName()).build();
    }

    @Transactional(readOnly = true)
    public List<SpecialisationResponse> listSpecialisations() {
        return specialisationRepository.findAll(Sort.by("name")).stream()
                .map(s -> SpecialisationResponse.builder().id(s.getId()).name(s.getName()).build())
                .toList();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public UserResponse toggleUserStatus(UUID userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        userRepository.updateActiveStatus(userId, active);
        user.setIsActive(active);
        log.info("Admin set user {} active={}", userId, active);
        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> listUsers(int page, int size) {
        Page<User> userPage = userRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return toPageResponse(userPage.map(this::toUserResponse));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private Doctor findDoctor(UUID id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
    }

    private List<DoctorWorkingHours> saveWorkingHours(Doctor doctor, List<WorkingHoursDto> dtos) {
        List<DoctorWorkingHours> entities = dtos.stream().map(dto -> {
            if (dto.getEndTime() != null && dto.getStartTime() != null
                    && !dto.getEndTime().isAfter(dto.getStartTime())) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "endTime must be after startTime for day " + dto.getDayOfWeek());
            }
            return DoctorWorkingHours.builder()
                    .doctor(doctor)
                    .dayOfWeek(dto.getDayOfWeek())
                    .startTime(dto.getStartTime())
                    .endTime(dto.getEndTime())
                    .build();
        }).toList();
        return workingHoursRepository.saveAll(entities);
    }

    private DoctorResponse toDoctorResponse(Doctor d,
                                             List<DoctorWorkingHours> hours,
                                             String tempPassword) {
        Specialisation spec = d.getSpecialisation();

        List<DoctorResponse.WorkingHoursSummary> hoursSummary = (hours != null)
                ? hours.stream().map(h -> DoctorResponse.WorkingHoursSummary.builder()
                        .dayOfWeek(h.getDayOfWeek())
                        .startTime(h.getStartTime())
                        .endTime(h.getEndTime())
                        .build()).toList()
                : List.of();

        return DoctorResponse.builder()
                .id(d.getId())
                .userId(d.getUser().getId())
                .firstName(d.getUser().getFirstName())
                .lastName(d.getUser().getLastName())
                .email(d.getUser().getEmail())
                .phoneNumber(d.getUser().getPhoneNumber())
                .specialisation(spec != null ? spec.getName() : null)
                .specialisationId(spec != null ? spec.getId() : null)
                .bio(d.getBio())
                .slotDurationMinutes(d.getSlotDurationMinutes())
                .isAvailable(d.getIsAvailable())
                .isActive(d.getUser().getIsActive())
                .licenceNumber(d.getLicenceNumber())
                .yearsOfExperience(d.getYearsOfExperience())
                .dateOfBirth(d.getDateOfBirth())
                .consultationFee(d.getConsultationFee())
                .averageRating(d.getAverageRating())
                .totalReviews(d.getTotalReviews())
                .workingHours(hoursSummary)
                .createdAt(d.getCreatedAt())
                .tempPassword(tempPassword)  // non-null only at creation
                .build();
    }

    private UserResponse toUserResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .role(u.getRole())
                .isActive(u.getIsActive())
                .isEmailVerified(u.getIsEmailVerified())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .build();
    }
}
