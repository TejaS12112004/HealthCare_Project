package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Response for a single doctor leave day.
 */
@Data
@Builder
public class LeaveDayResponse {

    private UUID      id;
    private LocalDate leaveDate;
    private String    reason;
}
