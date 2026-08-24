package com.healthcare.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class AppointmentRescheduledEvent extends ApplicationEvent {

    private final UUID appointmentId;
    private final LocalDateTime newSlotTime;

    public AppointmentRescheduledEvent(Object source, UUID appointmentId, LocalDateTime newSlotTime) {
        super(source);
        this.appointmentId = appointmentId;
        this.newSlotTime = newSlotTime;
    }
}
