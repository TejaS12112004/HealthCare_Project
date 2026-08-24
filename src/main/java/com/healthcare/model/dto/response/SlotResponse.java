package com.healthcare.model.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Response entry for a single appointment slot.
 * Returned by {@code GET /api/v1/doctors/{doctorId}/slots?date=...}.
 */
@Data
@Builder
public class SlotResponse {

    /** Slot start time (ISO-8601 local datetime). */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime slotTime;

    /** {@code true} if the slot has not been booked and has no active hold. */
    private boolean isAvailable;
}
