package com.healthcare.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Clinical notes written by the doctor after an appointment.
 * Aligned with V4 migration: {@code post_visit_notes} table.
 */
@Entity
@Table(name = "post_visit_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostVisitNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true,
                foreignKey = @ForeignKey(name = "fk_pvn_appointment"))
    private Appointment appointment;

    @Column(name = "clinical_notes", nullable = false, columnDefinition = "TEXT")
    private String clinicalNotes;

    /** The doctor (user) who submitted the notes. Nullable if user is deleted. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by",
                foreignKey = @ForeignKey(name = "fk_pvn_submitted_by"))
    private User submittedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
