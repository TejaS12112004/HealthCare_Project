package com.healthcare.repository;

import com.healthcare.model.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, UUID> {

    Optional<Doctor> findByUserId(UUID userId);

    Optional<Doctor> findByLicenceNumber(String licenceNumber);

    boolean existsByLicenceNumber(String licenceNumber);

    boolean existsByUserId(UUID userId);

    @Query("""
           SELECT d FROM Doctor d
           JOIN d.specialisation s
           WHERE LOWER(s.name) = LOWER(:specialisationName)
           AND d.isAvailable = true
           """)
    Page<Doctor> findBySpecialisationName(@Param("specialisationName") String specialisationName,
                                          Pageable pageable);

    @Query("""
           SELECT d FROM Doctor d
           JOIN d.user u
           LEFT JOIN d.specialisation s
           WHERE d.isAvailable = true
           AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(s.name)      LIKE LOWER(CONCAT('%', :query, '%')))
           """)
    Page<Doctor> searchDoctors(@Param("query") String query, Pageable pageable);

    long countByIsAvailable(Boolean isAvailable);

    /** Admin filter: all doctors (including unavailable) under a given specialisation. */
    Page<Doctor> findBySpecialisationId(UUID specialisationId, Pageable pageable);
}
