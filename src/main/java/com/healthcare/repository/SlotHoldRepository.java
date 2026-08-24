package com.healthcare.repository;

import com.healthcare.model.entity.SlotHold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SlotHoldRepository extends JpaRepository<SlotHold, UUID> {

    @Query("""
           SELECT sh FROM SlotHold sh
           WHERE sh.doctor.id = :doctorId
           AND sh.slotTime = :slotTime
           AND sh.isReleased = false
           AND sh.expiresAt > :now
           """)
    Optional<SlotHold> findActiveHold(
            @Param("doctorId") UUID doctorId,
            @Param("slotTime") LocalDateTime slotTime,
            @Param("now") LocalDateTime now);

    /** Finds all expired, unreleased holds (for cleanup scheduler). */
    @Query("SELECT sh FROM SlotHold sh WHERE sh.expiresAt <= :now AND sh.isReleased = false")
    List<SlotHold> findExpiredHolds(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE SlotHold sh SET sh.isReleased = true WHERE sh.expiresAt <= :now AND sh.isReleased = false")
    int releaseExpiredHolds(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE SlotHold sh SET sh.isReleased = true WHERE sh.patient.id = :patientId AND sh.doctor.id = :doctorId AND sh.slotTime = :slotTime")
    void releaseHold(@Param("patientId") UUID patientId,
                     @Param("doctorId") UUID doctorId,
                     @Param("slotTime") LocalDateTime slotTime);

    /**
     * Returns all active (unreleased, unexpired) held slot times for a doctor
     * within a date window. Used during slot-availability listing to batch-exclude held slots.
     */
    @Query("""
           SELECT sh.slotTime FROM SlotHold sh
           WHERE sh.doctor.id = :doctorId
           AND sh.slotTime >= :from
           AND sh.slotTime < :to
           AND sh.isReleased = false
           AND sh.expiresAt > :now
           """)
    List<LocalDateTime> findActiveHeldSlotTimes(
            @Param("doctorId")  UUID doctorId,
            @Param("from")      LocalDateTime from,
            @Param("to")        LocalDateTime to,
            @Param("now")       LocalDateTime now);
}
