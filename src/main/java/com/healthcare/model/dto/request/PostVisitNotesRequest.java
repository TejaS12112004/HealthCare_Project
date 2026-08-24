package com.healthcare.model.dto.request;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
public class PostVisitNotesRequest {

    @NotBlank(message = "Clinical notes cannot be empty")
    private String clinicalNotes;

    private List<PrescriptionDto> prescriptions;
}
