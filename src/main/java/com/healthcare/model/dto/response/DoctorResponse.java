package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DoctorResponse {

    private UUID          id;
    private UUID          userId;
    private String        firstName;
    private String        lastName;
    private String        email;
    private String        phoneNumber;
    private String        licenceNumber;
    private Integer       yearsOfExperience;
    private LocalDate     dateOfBirth;
    private String        bio;
    private BigDecimal    consultationFee;
    private BigDecimal    averageRating;
    private Integer       totalReviews;
    private Boolean       isAvailable;
    private Integer       slotDurationMinutes;
    private String        specialisation;     // single name (ManyToOne)
    private LocalDateTime createdAt;
}
