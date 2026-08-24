package com.healthcare.repository;

import com.healthcare.model.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for {@link Doctor} entity operations.
 */
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);

    Optional<Doctor> findByLicenceNumber(String licenceNumber);

    boolean existsByLicenceNumber(String licenceNumber);

    boolean existsByUserId(Long userId);

    /**
     * Fetch doctors by specialisation name with pagination.
     */
    @Query("""
           SELECT d FROM Doctor d
           JOIN d.specialisations s
           WHERE LOWER(s.name) = LOWER(:specialisationName)
           AND d.isAvailable = true
           """)
    Page<Doctor> findBySpecialisationName(@Param("specialisationName") String specialisationName,
                                          Pageable pageable);

    /**
     * Full-text search across doctor name and specialisation.
     */
    @Query("""
           SELECT DISTINCT d FROM Doctor d
           JOIN d.user u
           LEFT JOIN d.specialisations s
           WHERE d.isAvailable = true
           AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(s.name)      LIKE LOWER(CONCAT('%', :query, '%')))
           """)
    Page<Doctor> searchDoctors(@Param("query") String query, Pageable pageable);

    long countByIsAvailable(Boolean isAvailable);
}
