package com.healthcare.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RescheduleRequest {
    
    @NotNull(message = "New slot time is required")
    private LocalDateTime newSlotTime;
    
    // Optional: Rescheduling can also update the symptom form if needed
    private String symptoms;
    private Integer durationDays;
    private com.healthcare.model.enums.Severity severity;
    private String additionalNotes;
}
