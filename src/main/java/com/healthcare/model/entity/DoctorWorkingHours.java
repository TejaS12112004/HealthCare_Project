package com.healthcare.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.UUID;

/**
 * Defines the weekly recurring working window for a doctor on a given day.
 * Aligned with V2 migration: {@code doctor_working_hours} table.
 * {@code day_of_week}: 0 = Sunday … 6 = Saturday.
 */
@Entity
@Table(
    name = "doctor_working_hours",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_dwh_doctor_day", columnNames = {"doctor_id", "day_of_week"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorWorkingHours {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_dwh_doctor"))
    private Doctor doctor;

    /** 0 = Sunday, 1 = Monday, … 6 = Saturday. */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
}
