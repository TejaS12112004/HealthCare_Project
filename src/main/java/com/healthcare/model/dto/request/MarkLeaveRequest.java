package com.healthcare.model.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request body for {@code POST /api/v1/admin/doctors/{id}/leave}.
 */
@Data
public class MarkLeaveRequest {

    @NotNull(message = "leaveDate is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate leaveDate;

    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;
}
