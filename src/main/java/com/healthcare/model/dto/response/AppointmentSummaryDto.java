package com.healthcare.model.dto.response;

import com.healthcare.model.enums.AppointmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Compact appointment summary embedded inside {@link LeaveMarkResponse}
 * to show which appointments were affected by a leave day being marked.
 */
@Data
@Builder
public class AppointmentSummaryDto {

    private UUID              id;
    private UUID              patientId;
    private String            patientName;
    private String            patientEmail;
    private LocalDateTime     slotTime;
    private AppointmentStatus status;
}
