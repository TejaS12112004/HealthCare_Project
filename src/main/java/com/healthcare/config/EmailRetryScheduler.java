package com.healthcare.config;

import com.healthcare.model.entity.EmailLog;
import com.healthcare.repository.EmailLogRepository;
import com.healthcare.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.List;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class EmailRetryScheduler {

    private final EmailLogRepository emailLogRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 */15 * * * *") // Every 15 minutes
    public void retryFailedEmails() {
        log.info("Running background job to retry failed emails...");
        
        // PENDING or FAILED with retryCount < 3
        List<EmailLog> retryableEmails = emailLogRepository.findRetryable(3);
        
        for (EmailLog emailLog : retryableEmails) {
            log.info("Retrying email of type {} for {}", emailLog.getEmailType(), emailLog.getRecipientEmail());
            
            switch (emailLog.getEmailType()) {
                case BOOKING_CONFIRMATION:
                    if (emailLog.getAppointment() != null)
                        emailService.sendBookingConfirmation(emailLog.getAppointment().getId());
                    break;
                case BOOKING_REMINDER:
                    if (emailLog.getAppointment() != null)
                        emailService.sendAppointmentReminder(emailLog.getAppointment().getId());
                    break;
                case CANCELLATION:
                    if (emailLog.getAppointment() != null)
                        emailService.sendCancellationNotice(emailLog.getAppointment().getId());
                    break;
                case POST_VISIT_SUMMARY:
                    if (emailLog.getAppointment() != null)
                        emailService.sendPostVisitSummaryEmail(emailLog.getAppointment().getId());
                    break;
                // MEDICATION_REMINDER doesn't have an appointment_id natively in EmailLog,
                // but this could be handled differently. Since we didn't store medication_reminder ID
                // in EmailLog, we might just skip retrying it or handle it explicitly.
                default:
                    log.warn("Retry logic not implemented for email type {}", emailLog.getEmailType());
            }
        }
    }
}
