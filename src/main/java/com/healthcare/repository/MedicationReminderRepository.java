package com.healthcare.repository;

import com.healthcare.model.entity.MedicationReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, UUID> {

    List<MedicationReminder> findByPatientIdAndIsActive(UUID patientId, Boolean isActive);

    List<MedicationReminder> findByPrescriptionId(UUID prescriptionId);

    /**
     * Finds all due reminders for the current 15-minute window, guarded by a 23-hour cooldown.
     * scheduled_time is stored as UTC, so we compare against UTC now.
     * The 23-hour guard (instead of 24h) handles the edge case where the cron fires
     * slightly early across a midnight boundary.
     */
    @Query("""
           SELECT mr FROM MedicationReminder mr
           JOIN mr.prescription p
           WHERE mr.isActive = true
           AND mr.scheduledTime BETWEEN :windowStart AND :windowEnd
           AND p.startDate <= CURRENT_DATE
           AND p.endDate >= CURRENT_DATE
           AND (mr.lastSentAt IS NULL OR mr.lastSentAt < :cooldownCutoff)
           """)
    List<MedicationReminder> findDueReminders(
            @Param("windowStart") LocalTime windowStart,
            @Param("windowEnd") LocalTime windowEnd,
            @Param("cooldownCutoff") Instant cooldownCutoff);

    /** Deactivate all reminders for prescriptions whose end_date has passed. */
    @Modifying
    @Query("""
           UPDATE MedicationReminder mr SET mr.isActive = false
           WHERE mr.isActive = true
           AND mr.prescription.endDate < CURRENT_DATE
           """)
    int deactivateExpiredReminders();

    @Modifying
    @Query("UPDATE MedicationReminder mr SET mr.isActive = false WHERE mr.prescription.id = :prescriptionId")
    void deactivateByPrescription(@Param("prescriptionId") UUID prescriptionId);
}
