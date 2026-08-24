package com.healthcare.listener;

import com.healthcare.event.AppointmentConfirmedEvent;
import com.healthcare.service.LlmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentEventListener {

    private final LlmService llmService;

    @EventListener
    public void handleAppointmentConfirmed(AppointmentConfirmedEvent event) {
        log.info("Received AppointmentConfirmedEvent for appointment {}", event.getAppointmentId());
        llmService.generatePreVisitSummary(event.getAppointmentId());
    }
}
