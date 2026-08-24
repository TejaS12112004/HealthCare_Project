package com.healthcare.service;

import java.util.UUID;

public interface EmailService {
    void sendBookingConfirmation(UUID appointmentId);
    void sendCancellationNotice(UUID appointmentId);
    void sendAppointmentReminder(UUID appointmentId);
    void sendPostVisitSummaryEmail(UUID appointmentId);
    void sendMedicationReminder(UUID reminderId);
}
