package com.healthcare.service;

import com.healthcare.model.dto.response.SlotResponse;
import com.healthcare.model.entity.DoctorWorkingHours;
import com.healthcare.model.enums.AppointmentStatus;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.DoctorLeaveDayRepository;
import com.healthcare.repository.DoctorWorkingHoursRepository;
import com.healthcare.repository.SlotHoldRepository;
import com.healthcare.util.SlotUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Slot availability service.
 *
 * <h3>Exclusion rules (a slot is UNAVAILABLE when any of the following is true)</h3>
 * <ol>
 *   <li>The date is a {@link com.healthcare.model.entity.DoctorLeaveDay} for the doctor.</li>
 *   <li>The doctor has no working hours configured for that day-of-week.</li>
 *   <li>The slot time is in the past.</li>
 *   <li>A {@code CONFIRMED} or {@code PENDING} appointment already exists at that slot.</li>
 *   <li>An active {@link com.healthcare.model.entity.SlotHold} exists
 *       ({@code is_released = false} AND {@code expires_at > NOW()}).</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SlotService {

    private final DoctorWorkingHoursRepository workingHoursRepository;
    private final DoctorLeaveDayRepository     leaveDayRepository;
    private final AppointmentRepository        appointmentRepository;
    private final SlotHoldRepository           slotHoldRepository;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Returns a full list of {@link SlotResponse} objects for the given doctor and date,
     * marking each slot as available or unavailable.
     *
     * @param doctorId doctor UUID
     * @param date     calendar date to query
     * @return ordered list of all slots for the day (available + unavailable)
     */
    @Transactional(readOnly = true)
    public List<SlotResponse> getAvailableSlots(UUID doctorId, LocalDate date) {

        // ── Rule 1: Leave day → all slots unavailable ─────────────────────────
        if (leaveDayRepository.existsByDoctorIdAndLeaveDate(doctorId, date)) {
            log.debug("Doctor {} is on leave on {}", doctorId, date);
            return List.of();
        }

        // ── Rule 2: No working hours for this day → empty ─────────────────────
        int pgDay = SlotUtil.pgDayOfWeek(date);
        Optional<DoctorWorkingHours> hoursOpt =
                workingHoursRepository.findByDoctorIdAndDayOfWeek(doctorId, pgDay);

        if (hoursOpt.isEmpty()) {
            log.debug("Doctor {} has no working hours for day-of-week {} ({})", doctorId, pgDay, date);
            return List.of();
        }

        DoctorWorkingHours hours = hoursOpt.get();

        // Slot duration comes from the Doctor entity via working hours → doctor
        int slotDuration = hours.getDoctor().getSlotDurationMinutes() != null
                ? hours.getDoctor().getSlotDurationMinutes()
                : 30;

        // ── Generate all theoretical slots ────────────────────────────────────
        List<LocalDateTime> allSlots = SlotUtil.generateSlots(hours, date, slotDuration);

        if (allSlots.isEmpty()) {
            return List.of();
        }

        // ── Batch-load booked and held slots for the whole day ────────────────
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);
        LocalDateTime now        = LocalDateTime.now();

        Set<LocalDateTime> bookedSlots = appointmentRepository
                .findConflictingOnDate(
                        doctorId, startOfDay, endOfDay,
                        List.of(AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING))
                .stream()
                .map(a -> a.getSlotTime())
                .collect(Collectors.toSet());

        Set<LocalDateTime> heldSlots = Set.copyOf(
                slotHoldRepository.findActiveHeldSlotTimes(doctorId, startOfDay, endOfDay, now));

        // ── Build response list ───────────────────────────────────────────────
        return allSlots.stream()
                .map(slot -> {
                    boolean past     = SlotUtil.isSlotPast(slot);
                    boolean booked   = bookedSlots.contains(slot);
                    boolean onHold   = heldSlots.contains(slot);
                    boolean available = !past && !booked && !onHold;

                    return SlotResponse.builder()
                            .slotTime(slot)
                            .isAvailable(available)
                            .build();
                })
                .toList();
    }

    /**
     * Returns only the available slot start times for a given doctor and date.
     * Used internally by booking and search logic.
     */
    @Transactional(readOnly = true)
    public List<LocalDateTime> getAvailableSlotTimes(UUID doctorId, LocalDate date) {
        return getAvailableSlots(doctorId, date).stream()
                .filter(SlotResponse::isAvailable)
                .map(SlotResponse::getSlotTime)
                .toList();
    }

    /**
     * Checks whether a specific slot is still available at booking time.
     * Called inside a {@code @Transactional} booking flow to prevent race conditions.
     *
     * @param doctorId doctor UUID
     * @param slotTime exact slot start time
     * @return {@code true} if the slot can be booked
     */
    @Transactional(readOnly = true)
    public boolean isSlotAvailable(UUID doctorId, LocalDateTime slotTime) {
        LocalDate date = slotTime.toLocalDate();

        // Leave day check
        if (leaveDayRepository.existsByDoctorIdAndLeaveDate(doctorId, date)) {
            return false;
        }

        // Past slot check
        if (SlotUtil.isSlotPast(slotTime)) {
            return false;
        }

        // Working hours check — slot must fall within doctor's schedule for that day
        int pgDay = SlotUtil.pgDayOfWeek(date);
        Optional<DoctorWorkingHours> hoursOpt =
                workingHoursRepository.findByDoctorIdAndDayOfWeek(doctorId, pgDay);
        if (hoursOpt.isEmpty()) {
            return false;
        }

        DoctorWorkingHours hours     = hoursOpt.get();
        int slotDuration             = hours.getDoctor().getSlotDurationMinutes() != null
                                       ? hours.getDoctor().getSlotDurationMinutes() : 30;
        List<LocalDateTime> allSlots = SlotUtil.generateSlots(hours, date, slotDuration);
        if (!allSlots.contains(slotTime)) {
            return false;   // time doesn't align to any valid slot boundary
        }

        // Appointment conflict check
        boolean hasBooking = appointmentRepository.existsByDoctorIdAndSlotTimeAndStatusNotIn(
                doctorId, slotTime,
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW,
                        AppointmentStatus.RESCHEDULED));
        if (hasBooking) {
            return false;
        }

        // Active hold check
        return slotHoldRepository.findActiveHold(doctorId, slotTime, LocalDateTime.now()).isEmpty();
    }

    /**
     * Returns the first date within the next {@code lookAheadDays} days (inclusive of today)
     * that has at least one available slot for the given doctor.
     *
     * @param doctorId      doctor UUID
     * @param lookAheadDays number of days to search (e.g. 14)
     * @return the first date with availability, or {@code null} if none found
     */
    @Transactional(readOnly = true)
    public LocalDate findNextAvailableDate(UUID doctorId, int lookAheadDays) {
        LocalDate today = LocalDate.now();
        for (int i = 0; i < lookAheadDays; i++) {
            LocalDate candidate = today.plusDays(i);
            List<LocalDateTime> slots = getAvailableSlotTimes(doctorId, candidate);
            if (!slots.isEmpty()) {
                return candidate;
            }
        }
        return null;
    }
}
