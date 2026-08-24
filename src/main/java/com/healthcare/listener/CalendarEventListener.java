package com.healthcare.listener;

import com.healthcare.event.AppointmentCancelledEvent;
import com.healthcare.event.AppointmentConfirmedEvent;
import com.healthcare.event.AppointmentRescheduledEvent;
import com.healthcare.model.entity.Appointment;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.service.GoogleCalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class CalendarEventListener {

    private final GoogleCalendarService googleCalendarService;
    private final AppointmentRepository appointmentRepository;

    @Async
    @EventListener
    public void handleAppointmentConfirmed(AppointmentConfirmedEvent event) {
        log.info("Processing Google Calendar events for confirmed appointment {}", event.getAppointmentId());
        try {
            Appointment appt = appointmentRepository.findById(event.getAppointmentId()).orElse(null);
            if (appt == null) return;

            String patientEventId = googleCalendarService.createCalendarEvent(appt.getId(), appt.getPatient().getUser().getId());
            if (patientEventId != null) {
                appt.setGoogleCalendarEventIdPatient(patientEventId);
            }

            String doctorEventId = googleCalendarService.createCalendarEvent(appt.getId(), appt.getDoctor().getUser().getId());
            if (doctorEventId != null) {
                appt.setGoogleCalendarEventIdDoctor(doctorEventId);
            }

            if (patientEventId != null || doctorEventId != null) {
                appointmentRepository.save(appt);
            }
        } catch (Exception e) {
            log.error("Failed to process Google Calendar events for confirmed appointment {}", event.getAppointmentId(), e);
        }
    }

    @Async
    @EventListener
    public void handleAppointmentCancelled(AppointmentCancelledEvent event) {
        log.info("Processing Google Calendar events for cancelled appointment {}", event.getAppointmentId());
        try {
            Appointment appt = appointmentRepository.findById(event.getAppointmentId()).orElse(null);
            if (appt == null) return;

            if (appt.getGoogleCalendarEventIdPatient() != null) {
                googleCalendarService.deleteCalendarEvent(appt.getGoogleCalendarEventIdPatient(), appt.getPatient().getUser().getId());
            }

            if (appt.getGoogleCalendarEventIdDoctor() != null) {
                googleCalendarService.deleteCalendarEvent(appt.getGoogleCalendarEventIdDoctor(), appt.getDoctor().getUser().getId());
            }
        } catch (Exception e) {
            log.error("Failed to process Google Calendar events for cancelled appointment {}", event.getAppointmentId(), e);
        }
    }

    @Async
    @EventListener
    public void handleAppointmentRescheduled(AppointmentRescheduledEvent event) {
        log.info("Processing Google Calendar events for rescheduled appointment {}", event.getAppointmentId());
        try {
            Appointment appt = appointmentRepository.findById(event.getAppointmentId()).orElse(null);
            if (appt == null) return;

            if (appt.getGoogleCalendarEventIdPatient() != null) {
                googleCalendarService.updateCalendarEvent(appt.getGoogleCalendarEventIdPatient(), appt.getSlotTime(), appt.getPatient().getUser().getId());
            } else {
                String id = googleCalendarService.createCalendarEvent(appt.getId(), appt.getPatient().getUser().getId());
                if (id != null) appt.setGoogleCalendarEventIdPatient(id);
            }

            if (appt.getGoogleCalendarEventIdDoctor() != null) {
                googleCalendarService.updateCalendarEvent(appt.getGoogleCalendarEventIdDoctor(), appt.getSlotTime(), appt.getDoctor().getUser().getId());
            } else {
                String id = googleCalendarService.createCalendarEvent(appt.getId(), appt.getDoctor().getUser().getId());
                if (id != null) appt.setGoogleCalendarEventIdDoctor(id);
            }

            appointmentRepository.save(appt);
            
        } catch (Exception e) {
            log.error("Failed to process Google Calendar events for rescheduled appointment {}", event.getAppointmentId(), e);
        }
    }
}
