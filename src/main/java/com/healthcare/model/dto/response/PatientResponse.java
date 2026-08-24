package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Detailed patient profile returned to clients.
 */
@Data
@Builder
public class PatientResponse {

    private Long          id;
    private Long          userId;
    private String        firstName;
    private String        lastName;
    private String        email;
    private String        phoneNumber;
    private LocalDate     dateOfBirth;
    private String        gender;
    private String        bloodGroup;
    private String        allergies;
    private String        chronicConditions;
    private String        currentMedications;
    private String        emergencyContactName;
    private String        emergencyContactPhone;
    private String        address;
    private String        city;
    private String        state;
    private String        pincode;
    private LocalDateTime createdAt;
}
