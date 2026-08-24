package com.healthcare.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Application-level exception that carries an {@link HttpStatus} so that
 * {@link GlobalExceptionHandler} can map it to the correct HTTP response code
 * without needing a separate exception class per status.
 *
 * <p>Usage example:
 * <pre>{@code
 *     throw new AppException(HttpStatus.CONFLICT, "Email already registered");
 * }</pre>
 */
@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;

    public AppException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public AppException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }
}
