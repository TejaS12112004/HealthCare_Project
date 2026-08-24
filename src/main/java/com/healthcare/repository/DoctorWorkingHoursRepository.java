package com.healthcare.repository;

import com.healthcare.model.entity.DoctorWorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorWorkingHoursRepository extends JpaRepository<DoctorWorkingHours, UUID> {

    List<DoctorWorkingHours> findByDoctorIdOrderByDayOfWeek(UUID doctorId);

    Optional<DoctorWorkingHours> findByDoctorIdAndDayOfWeek(UUID doctorId, Integer dayOfWeek);

    boolean existsByDoctorIdAndDayOfWeek(UUID doctorId, Integer dayOfWeek);

    @Modifying
    @Query("DELETE FROM DoctorWorkingHours dwh WHERE dwh.doctor.id = :doctorId")
    void deleteAllByDoctorId(@Param("doctorId") UUID doctorId);
}
