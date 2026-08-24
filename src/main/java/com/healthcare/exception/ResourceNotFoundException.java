package com.healthcare.exception;

/**
 * Thrown when a requested resource cannot be found in the data store.
 * Maps to HTTP 404 in {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Convenience constructor that formats: "EntityName not found with field: value".
     *
     * @param resourceName name of the entity/resource type
     * @param fieldName    the lookup field (e.g., "id", "email")
     * @param fieldValue   the value that was searched for
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
