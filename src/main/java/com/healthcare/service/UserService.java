package com.healthcare.service;

import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.response.UserResponse;
import com.healthcare.model.entity.User;
import com.healthcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * General user-account service.
 * Provides operations accessible to any authenticated user for their own profile.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Retrieves the profile of the authenticated user by their email (JWT subject).
     */
    @Transactional(readOnly = true)
    public UserResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return toUserResponse(user);
    }

    /**
     * Retrieves a user profile by ID (admin use or self-lookup).
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return toUserResponse(user);
    }

    // ── Mapping helper ────────────────────────────────────────────────────────

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
}
