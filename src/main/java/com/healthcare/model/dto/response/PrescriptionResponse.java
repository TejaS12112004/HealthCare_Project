package com.healthcare.model.dto.response;

import com.healthcare.model.enums.ReminderFrequency;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PrescriptionResponse {

    private UUID id;
    private String medicationName;
    private String dosage;
    private ReminderFrequency frequency;
    private Integer durationDays;
    private LocalDate startDate;
    private LocalDate endDate;
    private String instructions;

    /** Reminder times converted back to the patient's local timezone for frontend display. */
    private List<LocalTime> reminderTimesLocal;
}
