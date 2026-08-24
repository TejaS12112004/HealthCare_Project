package com.healthcare.config;

import com.healthcare.model.entity.Appointment;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.EmailLogRepository;
import com.healthcare.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final EmailLogRepository emailLogRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void scheduleReminders() {
        log.info("Running appointment reminder scheduler...");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start24h = now.plusHours(23);
        LocalDateTime end24h = now.plusHours(25);
        
        LocalDateTime start1h = now.plusMinutes(55);
        LocalDateTime end1h = now.plusMinutes(65);

        List<Appointment> upcomingAppointments = appointmentRepository.findAppointmentsForReminders(start24h, end24h, start1h, end1h);

        for (Appointment appt : upcomingAppointments) {
            // Ensure no reminder was sent in the last 2 hours
            boolean recentlySent = emailLogRepository.hasRecentReminder(appt.getId(), now.minusHours(2));
            if (!recentlySent) {
                log.info("Sending reminder for appointment {}", appt.getId());
                emailService.sendAppointmentReminder(appt.getId());
            }
        }
    }
}
