package com.healthcare.model.entity;

import com.healthcare.model.enums.LlmStatus;
import com.healthcare.model.enums.UrgencyLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * LLM-generated pre-visit summary derived from the patient's symptom form.
 * Aligned with V4 migration: {@code pre_visit_summaries} table.
 * {@code suggested_questions} stores a JSON array as TEXT.
 */
@Entity
@Table(name = "pre_visit_summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreVisitSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true,
                foreignKey = @ForeignKey(name = "fk_pvs_appointment"))
    private Appointment appointment;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency_level", length = 10)
    private UrgencyLevel urgencyLevel;

    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    /** JSON array of suggested questions stored as text. */
    @Column(name = "suggested_questions", columnDefinition = "TEXT")
    private String suggestedQuestions;

    @Enumerated(EnumType.STRING)
    @Column(name = "llm_status", nullable = false, length = 20)
    @Builder.Default
    private LlmStatus llmStatus = LlmStatus.PENDING;

    @Column(name = "llm_raw_response", columnDefinition = "TEXT")
    private String llmRawResponse;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
