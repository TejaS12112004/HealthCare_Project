package com.healthcare.service;

import com.healthcare.exception.AppException;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.request.CreateDoctorRequest;
import com.healthcare.model.dto.response.DoctorResponse;
import com.healthcare.model.dto.response.PageResponse;
import com.healthcare.model.dto.response.UserResponse;
import com.healthcare.model.entity.Doctor;
import com.healthcare.model.entity.Specialisation;
import com.healthcare.model.entity.User;
import com.healthcare.model.enums.Role;
import com.healthcare.repository.DoctorRepository;
import com.healthcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Administrative service — manages doctors, users, and platform statistics.
 * All methods require the caller to hold the {@code ROLE_ADMIN} authority
 * (enforced in {@link com.healthcare.controller.AdminController} via
 * {@code @PreAuthorize}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository   userRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder  passwordEncoder;

    // ── Doctor management ─────────────────────────────────────────────────────

    /**
     * Creates a new doctor account and associated profile.
     */
    @Transactional
    public DoctorResponse createDoctor(CreateDoctorRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(HttpStatus.CONFLICT, "Email already in use.");
        }
        if (doctorRepository.existsByLicenceNumber(request.getLicenceNumber())) {
            throw new AppException(HttpStatus.CONFLICT, "Licence number already registered.");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.DOCTOR)
                .build();
        user = userRepository.save(user);

        Doctor doctor = Doctor.builder()
                .user(user)
                .licenceNumber(request.getLicenceNumber())
                .yearsOfExperience(request.getYearsOfExperience())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .build();

        doctor = doctorRepository.save(doctor);
        log.info("Admin created doctor: {}", user.getEmail());
        return toDoctorResponse(doctor);
    }

    /**
     * Returns a paginated list of all doctors.
     */
    @Transactional(readOnly = true)
    public PageResponse<DoctorResponse> listDoctors(int page, int size) {
        Page<Doctor> doctorPage = doctorRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return toPageResponse(doctorPage.map(this::toDoctorResponse));
    }

    /**
     * Retrieves a single doctor by ID.
     */
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        return toDoctorResponse(doctor);
    }

    /**
     * Toggles the active status of a user account.
     */
    @Transactional
    public UserResponse toggleUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        userRepository.updateActiveStatus(userId, active);
        user.setIsActive(active);
        log.info("Admin set user {} active={}", userId, active);
        return toUserResponse(user);
    }

    /**
     * Returns a paginated list of all users.
     */
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> listUsers(int page, int size) {
        Page<User> userPage = userRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return toPageResponse(userPage.map(this::toUserResponse));
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private DoctorResponse toDoctorResponse(Doctor d) {
        Set<String> specNames = d.getSpecialisations().stream()
                .map(Specialisation::getName)
                .collect(Collectors.toSet());

        return DoctorResponse.builder()
                .id(d.getId())
                .userId(d.getUser().getId())
                .firstName(d.getUser().getFirstName())
                .lastName(d.getUser().getLastName())
                .email(d.getUser().getEmail())
                .phoneNumber(d.getUser().getPhoneNumber())
                .licenceNumber(d.getLicenceNumber())
                .yearsOfExperience(d.getYearsOfExperience())
                .dateOfBirth(d.getDateOfBirth())
                .bio(d.getBio())
                .consultationFee(d.getConsultationFee())
                .averageRating(d.getAverageRating())
                .totalReviews(d.getTotalReviews())
                .isAvailable(d.getIsAvailable())
                .specialisations(specNames)
                .createdAt(d.getCreatedAt())
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
