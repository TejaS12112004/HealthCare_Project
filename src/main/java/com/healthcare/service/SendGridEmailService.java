package com.healthcare.service;

import com.healthcare.model.entity.*;
import com.healthcare.model.enums.EmailStatus;
import com.healthcare.model.enums.EmailType;
import com.healthcare.repository.*;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SendGridEmailService implements EmailService {

    @Value("${SENDGRID_API_KEY:}")
    private String apiKey;

    @Value("${EMAIL_FROM:noreply@yourdomain.com}")
    private String fromEmail;

    @Value("${EMAIL_FROM_NAME:Healthcare App}")
    private String fromName;

    private final TemplateEngine templateEngine;
    private final EmailLogRepository emailLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final PostVisitSummaryRepository postVisitSummaryRepository;
    private final MedicationReminderRepository medicationReminderRepository;

    @Override
    @Transactional
    public void sendBookingConfirmation(UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) return;
        
        // 1. To Patient
        Context context = new Context();
        context.setVariable("patientName", appointment.getPatient().getUser().getFirstName());
        context.setVariable("doctorName", appointment.getDoctor().getUser().getFullName());
        context.setVariable("date", appointment.getSlotTime().toLocalDate().toString());
        context.setVariable("time", appointment.getSlotTime().toLocalTime().toString());

        String html = templateEngine.process("email/booking-confirmation", context);
        String subject = "Booking Confirmation with Dr. " + appointment.getDoctor().getUser().getLastName();
        
        sendAndLog(appointment.getPatient().getUser().getEmail(), subject, html, EmailType.BOOKING_CONFIRMATION, appointment);
        
        // 2. To Doctor
        Context docContext = new Context();
        docContext.setVariable("patientName", appointment.getPatient().getUser().getFullName());
        docContext.setVariable("doctorName", appointment.getDoctor().getUser().getFirstName());
        docContext.setVariable("date", appointment.getSlotTime().toLocalDate().toString());
        docContext.setVariable("time", appointment.getSlotTime().toLocalTime().toString());
        
        String docHtml = templateEngine.process("email/booking-confirmation", docContext);
        sendAndLog(appointment.getDoctor().getUser().getEmail(), "New Appointment Booked", docHtml, EmailType.BOOKING_CONFIRMATION, appointment);
    }

    @Override
    @Transactional
    public void sendCancellationNotice(UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) return;

        // To Patient
        Context context = new Context();
        context.setVariable("patientName", appointment.getPatient().getUser().getFirstName());
        context.setVariable("doctorName", appointment.getDoctor().getUser().getFullName());
        context.setVariable("reason", appointment.getCancelledReason());
        
        String html = templateEngine.process("email/cancellation-notice", context);
        sendAndLog(appointment.getPatient().getUser().getEmail(), "Appointment Cancelled", html, EmailType.CANCELLATION, appointment);

        // To Doctor
        Context docContext = new Context();
        docContext.setVariable("patientName", appointment.getPatient().getUser().getFullName());
        docContext.setVariable("doctorName", appointment.getDoctor().getUser().getFirstName());
        docContext.setVariable("reason", appointment.getCancelledReason());
        
        String docHtml = templateEngine.process("email/cancellation-notice", docContext);
        sendAndLog(appointment.getDoctor().getUser().getEmail(), "Appointment Cancelled", docHtml, EmailType.CANCELLATION, appointment);
    }

    @Override
    @Transactional
    public void sendAppointmentReminder(UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) return;

        Context context = new Context();
        context.setVariable("patientName", appointment.getPatient().getUser().getFirstName());
        context.setVariable("doctorName", appointment.getDoctor().getUser().getFullName());
        // Calculate rough hours remaining
        long hours = java.time.Duration.between(LocalDateTime.now(), appointment.getSlotTime()).toHours();
        context.setVariable("hoursRemaining", hours > 0 ? hours : 1);
        
        String html = templateEngine.process("email/appointment-reminder", context);
        sendAndLog(appointment.getPatient().getUser().getEmail(), "Reminder: Upcoming Appointment", html, EmailType.BOOKING_REMINDER, appointment);
    }

    @Override
    @Transactional
    public void sendPostVisitSummaryEmail(UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        PostVisitSummary summary = postVisitSummaryRepository.findByAppointmentId(appointmentId).orElse(null);
        if (appointment == null || summary == null) return;

        Context context = new Context();
        context.setVariable("patientName", appointment.getPatient().getUser().getFirstName());
        context.setVariable("patientFriendlySummary", summary.getPatientFriendlySummary());
        context.setVariable("medicationSchedule", summary.getMedicationSchedule());
        context.setVariable("followUpSteps", summary.getFollowUpSteps());
        
        String html = templateEngine.process("email/post-visit-summary", context);
        sendAndLog(appointment.getPatient().getUser().getEmail(), "Your Visit Summary", html, EmailType.POST_VISIT_SUMMARY, appointment);
    }

    @Override
    @Transactional
    public void sendMedicationReminder(UUID reminderId) {
        MedicationReminder reminder = medicationReminderRepository.findById(reminderId).orElse(null);
        if (reminder == null) return;

        Context context = new Context();
        context.setVariable("patientName", reminder.getPatient().getUser().getFirstName());
        context.setVariable("medicationName", reminder.getPrescription().getMedicationName());
        context.setVariable("dosage", reminder.getPrescription().getDosage());
        context.setVariable("time", reminder.getScheduledTime().format(DateTimeFormatter.ofPattern("HH:mm")));
        
        String html = templateEngine.process("email/medication-reminder", context);
        sendAndLog(reminder.getPatient().getUser().getEmail(), "Medication Reminder", html, EmailType.MEDICATION_REMINDER, null);
    }

    private void sendAndLog(String to, String subject, String htmlContent, EmailType type, Appointment appointment) {
        EmailLog emailLog = EmailLog.builder()
                .recipientEmail(to)
                .subject(subject)
                .emailType(type)
                .appointment(appointment)
                .status(EmailStatus.PENDING)
                .build();
        
        emailLog = emailLogRepository.save(emailLog);

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("SENDGRID_API_KEY missing - skipping send, logging as FAILED");
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMessage("SENDGRID_API_KEY is missing");
            emailLog.setRetryCount(1);
            emailLogRepository.save(emailLog);
            return;
        }

        try {
            Email from = new Email(fromEmail, fromName);
            Email toEmail = new Email(to);
            Content content = new Content("text/html", htmlContent);
            Mail mail = new Mail(from, subject, toEmail, content);

            SendGrid sg = new SendGrid(apiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                emailLog.setStatus(EmailStatus.SENT);
                emailLog.setSentAt(LocalDateTime.now());
                log.info("Email sent successfully to {}", to);
            } else {
                emailLog.setStatus(EmailStatus.FAILED);
                emailLog.setErrorMessage("SendGrid error: " + response.getStatusCode() + " " + response.getBody());
                emailLog.setRetryCount(emailLog.getRetryCount() + 1);
                log.error("Failed to send email to {}. Response: {}", to, response.getBody());
            }
        } catch (Exception e) {
            log.error("Exception while sending email to {}", to, e);
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            emailLog.setRetryCount(emailLog.getRetryCount() + 1);
        }

        emailLogRepository.save(emailLog);
    }
}
