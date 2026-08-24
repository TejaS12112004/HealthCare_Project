package com.healthcare.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Doctor profile entity linked one-to-one with a {@link User} account.
 * Captures professional attributes such as licence number, specialisations,
 * consultation fee, and availability toggle.
 */
@Entity
@Table(
    name = "doctors",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_doctors_user_id", columnNames = "user_id"),
        @UniqueConstraint(name = "uk_doctors_licence", columnNames = "licence_number")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_doctors_user"))
    private User user;

    @Column(name = "licence_number", nullable = false, length = 50)
    private String licenceNumber;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "consultation_fee", precision = 10, scale = 2)
    private BigDecimal consultationFee;

    @Column(name = "average_rating", precision = 3, scale = 2)
    private BigDecimal averageRating;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "doctor_specialisations",
        joinColumns = @JoinColumn(name = "doctor_id",
                                  foreignKey = @ForeignKey(name = "fk_ds_doctor")),
        inverseJoinColumns = @JoinColumn(name = "specialisation_id",
                                         foreignKey = @ForeignKey(name = "fk_ds_specialisation"))
    )
    @Builder.Default
    private Set<Specialisation> specialisations = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
