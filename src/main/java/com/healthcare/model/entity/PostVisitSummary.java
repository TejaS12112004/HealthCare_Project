package com.healthcare.model.entity;

import com.healthcare.model.enums.LlmStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * LLM-generated patient-friendly summary produced from post-visit clinical notes.
 * Aligned with V4 migration: {@code post_visit_summaries} table.
 */
@Entity
@Table(name = "post_visit_summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostVisitSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true,
                foreignKey = @ForeignKey(name = "fk_povs_appointment"))
    private Appointment appointment;

    @Column(name = "patient_friendly_summary", columnDefinition = "TEXT")
    private String patientFriendlySummary;

    @Column(name = "medication_schedule", columnDefinition = "TEXT")
    private String medicationSchedule;

    @Column(name = "follow_up_steps", columnDefinition = "TEXT")
    private String followUpSteps;

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
