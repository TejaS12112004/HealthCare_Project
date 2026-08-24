package com.healthcare.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Response for specialisation create/list endpoints.
 */
@Data
@Builder
public class SpecialisationResponse {

    private UUID   id;
    private String name;
}
