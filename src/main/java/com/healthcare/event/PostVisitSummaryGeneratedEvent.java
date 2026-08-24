package com.healthcare.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class PostVisitSummaryGeneratedEvent extends ApplicationEvent {
    private final UUID appointmentId;

    public PostVisitSummaryGeneratedEvent(Object source, UUID appointmentId) {
        super(source);
        this.appointmentId = appointmentId;
    }
}
