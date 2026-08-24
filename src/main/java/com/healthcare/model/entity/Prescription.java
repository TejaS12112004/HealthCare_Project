package com.healthcare.model.entity;

import com.healthcare.model.enums.ReminderFrequency;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Medication prescription issued after an appointment.
 * Aligned with V5 migration: {@code prescriptions} table.
 * {@code end_date} is a PostgreSQL GENERATED ALWAYS AS STORED column —
 * mapped as read-only ({@code insertable=false, updatable=false}).
 */
@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_rx_appointment"))
    private Appointment appointment;

    @Column(name = "medication_name", nullable = false, length = 255)
    private String medicationName;

    @Column(name = "dosage", length = 100)
    private String dosage;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 30)
    private ReminderFrequency frequency;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /**
     * Computed by PostgreSQL: {@code start_date + duration_days}.
     * Never set by the application — read-only from the DB.
     */
    @Column(name = "end_date", insertable = false, updatable = false)
    private LocalDate endDate;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
