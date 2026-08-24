package com.healthcare.model.dto.request;

import com.healthcare.model.enums.Severity;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmBookingRequest {

    @NotBlank(message = "Symptoms are required")
    private String symptoms;

    private Integer durationDays;

    private Severity severity;

    private String additionalNotes;
}
