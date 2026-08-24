package com.healthcare.repository;

import com.healthcare.model.entity.DoctorLeaveDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorLeaveDayRepository extends JpaRepository<DoctorLeaveDay, UUID> {

    Optional<DoctorLeaveDay> findByDoctorIdAndLeaveDate(UUID doctorId, LocalDate leaveDate);

    boolean existsByDoctorIdAndLeaveDate(UUID doctorId, LocalDate leaveDate);

    /** Returns all leave days for a doctor within a date range (e.g. a calendar month). */
    List<DoctorLeaveDay> findByDoctorIdAndLeaveDateBetweenOrderByLeaveDate(
            UUID doctorId, LocalDate from, LocalDate to);

    /** Returns all future leave days for a doctor (useful for public availability checks). */
    @Query("SELECT d FROM DoctorLeaveDay d WHERE d.doctor.id = :doctorId AND d.leaveDate >= :today ORDER BY d.leaveDate")
    List<DoctorLeaveDay> findUpcomingLeaves(@Param("doctorId") UUID doctorId,
                                            @Param("today") LocalDate today);

    @Modifying
    @Query("DELETE FROM DoctorLeaveDay d WHERE d.doctor.id = :doctorId AND d.leaveDate = :leaveDate")
    int deleteByDoctorIdAndLeaveDate(@Param("doctorId") UUID doctorId,
                                     @Param("leaveDate") LocalDate leaveDate);
}
