package com.healthcare.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * A scheduled daily medication reminder linked to a prescription.
 * The reminder scheduler dispatches email/notifications for active reminders.
 * Aligned with V5 migration: {@code medication_reminders} table.
 */
@Entity
@Table(name = "medication_reminders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicationReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prescription_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_mr_prescription"))
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_mr_patient"))
    private Patient patient;

    @Column(name = "scheduled_time", nullable = false)
    private LocalTime scheduledTime;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /** UTC timestamp of the last successful email send. Used for 23-hour deduplication guard. */
    @Column(name = "last_sent_at")
    private java.time.Instant lastSentAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
