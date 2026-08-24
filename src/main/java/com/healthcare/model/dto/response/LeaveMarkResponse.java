package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * Response for {@code POST /api/v1/admin/doctors/{id}/leave}.
 * Confirms the leave was saved and lists any appointments that were
 * automatically cancelled as a result.
 */
@Data
@Builder
public class LeaveMarkResponse {

    private Boolean                   leaveSaved;
    private LocalDate                 leaveDate;

    /** Appointments that were CONFIRMED or PENDING on the leave date and have been cancelled. */
    private List<AppointmentSummaryDto> affectedAppointments;

    /** Number of cancellation emails queued in email_logs. */
    private Integer emailsQueued;
}
