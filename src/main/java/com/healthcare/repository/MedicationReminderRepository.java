package com.healthcare.repository;

import com.healthcare.model.entity.MedicationReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, UUID> {

    List<MedicationReminder> findByPatientIdAndIsActive(UUID patientId, Boolean isActive);

    /** Used by the reminder scheduler to find all due reminders at a given time. */
    @Query("""
           SELECT mr FROM MedicationReminder mr
           WHERE mr.isActive = true
           AND mr.scheduledTime = :time
           """)
    List<MedicationReminder> findActiveRemindersAtTime(@Param("time") LocalTime time);

    @Modifying
    @Query("UPDATE MedicationReminder mr SET mr.isActive = false WHERE mr.prescription.id = :prescriptionId")
    void deactivateByPrescription(@Param("prescriptionId") UUID prescriptionId);
}
