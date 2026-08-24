package com.healthcare.repository;

import com.healthcare.model.entity.Appointment;
import com.healthcare.model.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    Page<Appointment> findByPatientId(UUID patientId, Pageable pageable);

    Page<Appointment> findByDoctorId(UUID doctorId, Pageable pageable);

    Page<Appointment> findByPatientIdAndStatus(UUID patientId, AppointmentStatus status, Pageable pageable);

    boolean existsByDoctorIdAndSlotTimeAndStatusNotIn(
            UUID doctorId, LocalDateTime slotTime, List<AppointmentStatus> excludedStatuses);

    @Query("""
           SELECT a FROM Appointment a
           WHERE a.doctor.id = :doctorId
           AND a.slotTime BETWEEN :from AND :to
           AND a.status NOT IN ('CANCELLED', 'RESCHEDULED')
           """)
    List<Appointment> findBookedSlotsForDoctor(
            @Param("doctorId") UUID doctorId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("""
           SELECT a FROM Appointment a
           WHERE a.slotTime BETWEEN :from AND :to
           AND a.status = 'CONFIRMED'
           """)
    List<Appointment> findConfirmedAppointmentsInWindow(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    Optional<Appointment> findByDoctorIdAndSlotTime(UUID doctorId, LocalDateTime slotTime);

    long countByStatus(AppointmentStatus status);
}
