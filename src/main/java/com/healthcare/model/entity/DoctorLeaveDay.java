package com.healthcare.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a single day on which a doctor is unavailable (leave).
 * Aligned with V2 migration: {@code doctor_leave_days} table.
 */
@Entity
@Table(
    name = "doctor_leave_days",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_dld_doctor_date", columnNames = {"doctor_id", "leave_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorLeaveDay {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_dld_doctor"))
    private Doctor doctor;

    @Column(name = "leave_date", nullable = false)
    private LocalDate leaveDate;

    @Column(name = "reason", length = 255)
    private String reason;
}
