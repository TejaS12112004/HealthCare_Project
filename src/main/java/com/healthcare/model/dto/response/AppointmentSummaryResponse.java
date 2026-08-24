package com.healthcare.model.dto.response;

import com.healthcare.model.enums.AppointmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AppointmentSummaryResponse {
    private UUID id;
    private String doctorName;
    private String patientName;
    private LocalDateTime slotTime;
    private AppointmentStatus status;
}
