package com.healthcare.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.model.entity.PostVisitNote;
import com.healthcare.model.entity.PostVisitSummary;
import com.healthcare.model.entity.PreVisitSummary;
import com.healthcare.model.entity.SymptomForm;
import com.healthcare.model.enums.LlmStatus;
import com.healthcare.model.enums.UrgencyLevel;
import com.healthcare.repository.PostVisitNoteRepository;
import com.healthcare.repository.PostVisitSummaryRepository;
import com.healthcare.repository.PreVisitSummaryRepository;
import com.healthcare.repository.SymptomFormRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LlmService {

    private final LlmApiClient llmApiClient;
    private final PreVisitSummaryRepository preVisitSummaryRepository;
    private final SymptomFormRepository symptomFormRepository;
    private final PostVisitSummaryRepository postVisitSummaryRepository;
    private final PostVisitNoteRepository postVisitNoteRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Async("llm-executor")
    public void generatePreVisitSummary(UUID appointmentId) {
        log.info("Starting generatePreVisitSummary for appointment {}", appointmentId);
        
        PreVisitSummary pvs = preVisitSummaryRepository.findByAppointmentId(appointmentId)
                .orElse(null);
                
        if (pvs == null) {
            log.warn("PreVisitSummary not found for appointment {}", appointmentId);
            return;
        }

        SymptomForm form = symptomFormRepository.findByAppointmentId(appointmentId)
                .orElse(null);
                
        if (form == null) {
            log.warn("SymptomForm not found for appointment {}", appointmentId);
            return;
        }

        try {
            String prompt = String.format("""
                    Analyse these symptoms and return a JSON object with exactly these fields:
                    { "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",
                      "chiefComplaint": "string",
                      "suggestedQuestions": ["question1", "question2", "question3"] }
                    Return ONLY valid JSON, no markdown, no explanation.
                    Symptoms: %s. Duration: %d days. Severity: %s. Additional Notes: %s
                    """, 
                    form.getSymptoms(), 
                    form.getDurationDays(), 
                    form.getSeverity(),
                    form.getAdditionalNotes());

            String rawResponse = llmApiClient.generateCompletion(prompt);
            pvs.setLlmRawResponse(rawResponse);
            
            // Cleanup markdown json block if LLM accidentally included it
            if (rawResponse.startsWith("```json")) {
                rawResponse = rawResponse.substring(7);
                if (rawResponse.endsWith("```")) {
                    rawResponse = rawResponse.substring(0, rawResponse.length() - 3);
                }
            }

            JsonNode root = objectMapper.readTree(rawResponse);
            
            pvs.setUrgencyLevel(UrgencyLevel.valueOf(root.path("urgencyLevel").asText("LOW").toUpperCase()));
            pvs.setChiefComplaint(root.path("chiefComplaint").asText());
            
            JsonNode questionsNode = root.path("suggestedQuestions");
            if (questionsNode.isArray()) {
                pvs.setSuggestedQuestions(questionsNode.toString());
            }

            pvs.setLlmStatus(LlmStatus.COMPLETED);
            preVisitSummaryRepository.save(pvs);
            log.info("Successfully generated pre-visit summary for appointment {}", appointmentId);
            
        } catch (Exception e) {
            log.error("Failed to generate pre-visit summary for appointment {}", appointmentId, e);
            handlePreVisitFailure(pvs);
        }
    }

    @Async("llm-executor")
    public void generatePostVisitSummary(UUID appointmentId) {
        log.info("Starting generatePostVisitSummary for appointment {}", appointmentId);
        
        PostVisitSummary pvs = postVisitSummaryRepository.findByAppointmentId(appointmentId)
                .orElse(null);
                
        if (pvs == null) {
            log.warn("PostVisitSummary not found for appointment {}", appointmentId);
            return;
        }

        PostVisitNote note = postVisitNoteRepository.findByAppointmentId(appointmentId)
                .orElse(null);
                
        if (note == null) {
            log.warn("PostVisitNote not found for appointment {}", appointmentId);
            return;
        }

        try {
            String prompt = String.format("""
                    Convert these clinical notes into a patient-friendly summary. Return a JSON object:
                    { "patientFriendlySummary": "string",
                      "medicationSchedule": "string",
                      "followUpSteps": "string" }
                    Return ONLY valid JSON, no markdown.
                    Clinical notes: %s
                    """, note.getClinicalNotes());

            String rawResponse = llmApiClient.generateCompletion(prompt);
            pvs.setLlmRawResponse(rawResponse);
            
            if (rawResponse.startsWith("```json")) {
                rawResponse = rawResponse.substring(7);
                if (rawResponse.endsWith("```")) {
                    rawResponse = rawResponse.substring(0, rawResponse.length() - 3);
                }
            }

            JsonNode root = objectMapper.readTree(rawResponse);
            pvs.setPatientFriendlySummary(root.path("patientFriendlySummary").asText());
            pvs.setMedicationSchedule(root.path("medicationSchedule").asText());
            pvs.setFollowUpSteps(root.path("followUpSteps").asText());
            
            pvs.setLlmStatus(LlmStatus.COMPLETED);
            postVisitSummaryRepository.save(pvs);
            log.info("Successfully generated post-visit summary for appointment {}", appointmentId);
            
            applicationEventPublisher.publishEvent(new com.healthcare.event.PostVisitSummaryGeneratedEvent(this, appointmentId));
            
        } catch (Exception e) {
            log.error("Failed to generate post-visit summary for appointment {}", appointmentId, e);
            handlePostVisitFailure(pvs);
        }
    }

    private void handlePreVisitFailure(PreVisitSummary pvs) {
        pvs.setRetryCount(pvs.getRetryCount() + 1);
        pvs.setLlmStatus(LlmStatus.FAILED);
        preVisitSummaryRepository.save(pvs);
    }

    private void handlePostVisitFailure(PostVisitSummary pvs) {
        pvs.setRetryCount(pvs.getRetryCount() + 1);
        pvs.setLlmStatus(LlmStatus.FAILED);
        postVisitSummaryRepository.save(pvs);
    }
}
