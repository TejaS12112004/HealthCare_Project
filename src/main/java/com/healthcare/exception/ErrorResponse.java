package com.healthcare.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standardised error response body returned for all API errors.
 * Shape: { "status": int, "error": string, "message": string, "timestamp": ISO8601 }
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    /** HTTP status code (e.g., 400, 401, 404, 500). */
    private int status;

    /** Short HTTP status reason phrase (e.g., "Bad Request", "Not Found"). */
    private String error;

    /** Human-readable description of what went wrong. */
    private String message;

    /** UTC timestamp of when the error occurred, formatted as ISO-8601. */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
