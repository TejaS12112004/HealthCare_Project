package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Detailed doctor profile returned to clients.
 */
@Data
@Builder
public class DoctorResponse {

    private Long          id;
    private Long          userId;
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
    private Set<String>   specialisations;   // names only for brevity
    private LocalDateTime createdAt;
}
