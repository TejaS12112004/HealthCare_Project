package com.healthcare.model.dto.request;

import com.healthcare.model.enums.ReminderFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PrescriptionDto {

    @NotBlank(message = "Medication name is required")
    private String medicationName;

    private String dosage;

    @NotNull(message = "Frequency is required")
    private ReminderFrequency frequency;

    @NotNull(message = "Duration in days is required")
    private Integer durationDays;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private String instructions;
}
