package com.healthcare.listener;

import com.healthcare.event.AppointmentCancelledEvent;
import com.healthcare.event.AppointmentConfirmedEvent;
import com.healthcare.event.AppointmentRescheduledEvent;
import com.healthcare.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailEventListener {

    private final EmailService emailService;

    @Async
    @EventListener
    public void handleAppointmentConfirmed(AppointmentConfirmedEvent event) {
        log.info("Sending booking confirmation for appointment {}", event.getAppointmentId());
        emailService.sendBookingConfirmation(event.getAppointmentId());
    }

    @Async
    @EventListener
    public void handleAppointmentCancelled(AppointmentCancelledEvent event) {
        log.info("Sending cancellation notice for appointment {}", event.getAppointmentId());
        emailService.sendCancellationNotice(event.getAppointmentId());
    }

    @Async
    @EventListener
    public void handleAppointmentRescheduled(AppointmentRescheduledEvent event) {
        log.info("Sending reschedule notices for appointment {}", event.getAppointmentId());
        // A reschedule effectively cancels the old slot and books a new one, 
        // but since we update the same appointment ID, we send a cancellation notice
        // then a booking confirmation. 
        emailService.sendCancellationNotice(event.getAppointmentId());
        emailService.sendBookingConfirmation(event.getAppointmentId());
    }

    @Async
    @EventListener
    public void handlePostVisitSummaryGenerated(com.healthcare.event.PostVisitSummaryGeneratedEvent event) {
        log.info("Sending post-visit summary for appointment {}", event.getAppointmentId());
        emailService.sendPostVisitSummaryEmail(event.getAppointmentId());
    }
}
