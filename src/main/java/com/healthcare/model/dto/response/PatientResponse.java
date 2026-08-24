package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PatientResponse {

    private UUID          id;
    private UUID          userId;
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
    private String        emergencyContact;   // single field aligned to V2 schema
    private String        address;
    private String        city;
    private String        state;
    private String        pincode;
    private LocalDateTime createdAt;
}
