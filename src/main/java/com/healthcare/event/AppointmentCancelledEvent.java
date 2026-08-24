package com.healthcare.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class AppointmentCancelledEvent extends ApplicationEvent {

    private final UUID appointmentId;
    private final String cancelledReason;

    public AppointmentCancelledEvent(Object source, UUID appointmentId, String cancelledReason) {
        super(source);
        this.appointmentId = appointmentId;
        this.cancelledReason = cancelledReason;
    }
}
