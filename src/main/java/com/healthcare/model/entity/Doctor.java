package com.healthcare.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Doctor profile entity linked one-to-one with a {@link User} account.
 * Aligned with V2 migration:
 * <ul>
 *   <li>UUID PK</li>
 *   <li>Single {@link Specialisation} via many-to-one (not many-to-many)</li>
 *   <li>{@code slot_duration_minutes} column</li>
 * </ul>
 */
@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_doctors_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialisation_id",
                foreignKey = @ForeignKey(name = "fk_doctors_specialisation"))
    private Specialisation specialisation;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "licence_number", unique = true, length = 50)
    private String licenceNumber;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "consultation_fee", precision = 10, scale = 2)
    private BigDecimal consultationFee;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "slot_duration_minutes", nullable = false)
    @Builder.Default
    private Integer slotDurationMinutes = 30;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
