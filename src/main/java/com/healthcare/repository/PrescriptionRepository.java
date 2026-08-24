package com.healthcare.repository;

import com.healthcare.model.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {

    List<Prescription> findByAppointmentId(UUID appointmentId);

    /** Active prescriptions for a patient where end_date >= today. */
    @Query("""
           SELECT p FROM Prescription p
           JOIN p.appointment a
           WHERE a.patient.id = :patientId
           AND p.endDate >= :today
           """)
    List<Prescription> findActiveForPatient(@Param("patientId") UUID patientId,
                                            @Param("today") LocalDate today);
}
