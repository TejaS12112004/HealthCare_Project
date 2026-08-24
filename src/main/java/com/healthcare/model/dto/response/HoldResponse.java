package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class HoldResponse {
    private UUID holdId;
    private String doctorName;
    private LocalDateTime slotTime;
    private LocalDateTime expiresAt;
}
