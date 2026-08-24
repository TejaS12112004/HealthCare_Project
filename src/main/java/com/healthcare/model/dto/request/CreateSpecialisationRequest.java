package com.healthcare.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Admin request body for {@code POST /api/v1/admin/specialisations}.
 */
@Data
public class CreateSpecialisationRequest {

    @NotBlank(message = "Specialisation name is required")
    @Size(min = 2, max = 100, message = "Name must be 2–100 characters")
    private String name;
}
