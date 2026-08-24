package com.healthcare.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Medical specialisation (e.g. Cardiology, Orthopedics).
 * Aligned with V2 migration: UUID PK, only {@code id} and {@code name}.
 * Doctors reference a single specialisation via a FK on the doctors table.
 */
@Entity
@Table(name = "specialisations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Specialisation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;
}
