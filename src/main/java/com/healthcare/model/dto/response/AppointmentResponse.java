package com.healthcare.model.dto.response;

import com.healthcare.model.enums.AppointmentStatus;
import com.healthcare.model.enums.LlmStatus;
import com.healthcare.model.enums.Severity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AppointmentResponse {
    private UUID id;
    
    private DoctorInfo doctor;
    private PatientInfo patient;
    
    private LocalDateTime slotTime;
    private AppointmentStatus status;
    private String cancelledReason;

    private SymptomFormDto symptomForm;
    private PreVisitSummaryDto preVisitSummary;

    @Data
    @Builder
    public static class DoctorInfo {
        private UUID id;
        private String name;
        private String specialisation;
    }

    @Data
    @Builder
    public static class PatientInfo {
        private UUID id;
        private String name;
    }

    @Data
    @Builder
    public static class SymptomFormDto {
        private String symptoms;
        private Integer durationDays;
        private Severity severity;
        private String additionalNotes;
    }

    @Data
    @Builder
    public static class PreVisitSummaryDto {
        private LlmStatus llmStatus;
        private com.healthcare.model.enums.UrgencyLevel urgencyLevel;
        private String chiefComplaint;
        private String suggestedQuestions;
    }
}
