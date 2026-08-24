package com.healthcare.service;

import com.healthcare.model.entity.MedicationReminder;
import com.healthcare.model.entity.Patient;
import com.healthcare.model.entity.Prescription;
import com.healthcare.model.enums.ReminderFrequency;
import com.healthcare.repository.MedicationReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicationReminderService {

    private final MedicationReminderRepository medicationReminderRepository;

    /**
     * Creates medication_reminders rows for a prescription.
     * Local times (08:00, 14:00, 20:00) are converted to UTC using the patient's timezone
     * before being stored, so the scheduler can compare directly against UTC NOW().
     */
    @Transactional
    public void createRemindersForPrescription(Prescription prescription, Patient patient) {
        ZoneId patientZone = ZoneId.of(
                patient.getTimezone() != null ? patient.getTimezone() : "Asia/Kolkata");

        List<LocalTime> localTimes = getLocalTimesForFrequency(prescription.getFrequency());

        for (LocalTime localTime : localTimes) {
            ZonedDateTime zdt = ZonedDateTime.now(patientZone).with(localTime);
            LocalTime utcTime = zdt.withZoneSameInstant(ZoneId.of("UTC")).toLocalTime();

            MedicationReminder reminder = MedicationReminder.builder()
                    .prescription(prescription)
                    .patient(patient)
                    .scheduledTime(utcTime)
                    .isActive(true)
                    .build();
            medicationReminderRepository.save(reminder);
            log.debug("Created reminder for prescription {} at UTC {} (local {})", prescription.getId(), utcTime, localTime);
        }
    }

    @Transactional
    public void cancelReminders(UUID prescriptionId) {
        medicationReminderRepository.deactivateByPrescription(prescriptionId);
        log.info("Deactivated all reminders for prescription {}", prescriptionId);
    }

    private List<LocalTime> getLocalTimesForFrequency(ReminderFrequency frequency) {
        List<LocalTime> times = new ArrayList<>();
        switch (frequency) {
            case ONCE_DAILY:
                times.add(LocalTime.of(8, 0));
                break;
            case TWICE_DAILY:
                times.add(LocalTime.of(8, 0));
                times.add(LocalTime.of(20, 0));
                break;
            case THRICE_DAILY:
                times.add(LocalTime.of(8, 0));
                times.add(LocalTime.of(14, 0));
                times.add(LocalTime.of(20, 0));
                break;
        }
        return times;
    }
}
