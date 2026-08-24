package com.healthcare.config;

import com.healthcare.model.entity.MedicationReminder;
import com.healthcare.repository.MedicationReminderRepository;
import com.healthcare.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MedicationReminderJob {

    private final MedicationReminderRepository medicationReminderRepository;
    private final EmailService emailService;

    /**
     * Fires every 15 minutes to dispatch medication reminders.
     * We compare the stored UTC scheduled_time against a 15-minute window from now.
     * The 23-hour cooldown guard prevents duplicate sends within the same day.
     */
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void dispatchReminders() {
        LocalTime nowUtc = LocalTime.now(ZoneId.of("UTC"));
        LocalTime windowEnd = nowUtc.plusMinutes(15);
        Instant cooldownCutoff = Instant.now().minusSeconds(23 * 3600);

        List<MedicationReminder> dueReminders = medicationReminderRepository
                .findDueReminders(nowUtc, windowEnd, cooldownCutoff);

        if (dueReminders.isEmpty()) return;

        log.info("MedicationReminderJob: {} reminder(s) due at UTC {}", dueReminders.size(), nowUtc);

        for (MedicationReminder reminder : dueReminders) {
            try {
                emailService.sendMedicationReminder(reminder.getId());
                reminder.setLastSentAt(Instant.now());
                medicationReminderRepository.save(reminder);
            } catch (Exception e) {
                // EmailService never throws, but defensive catch to avoid one failure aborting the batch
                log.error("Unexpected error dispatching reminder {}", reminder.getId(), e);
            }
        }
    }

    /**
     * Daily midnight job: deactivate reminders whose prescription end_date has passed.
     * Runs at 00:05 UTC to ensure midnight boundary is safely past.
     */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void deactivateExpiredReminders() {
        int count = medicationReminderRepository.deactivateExpiredReminders();
        if (count > 0) {
            log.info("MedicationReminderJob: deactivated {} expired reminder(s)", count);
        }
    }
}
