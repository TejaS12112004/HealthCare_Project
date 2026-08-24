package com.healthcare.service;

import com.google.api.client.auth.oauth2.AuthorizationCodeRequestUrl;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.healthcare.model.entity.Appointment;
import com.healthcare.model.entity.User;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.UserRepository;
import com.healthcare.util.EncryptionUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.UUID;

@Slf4j
@Service
public class GoogleCalendarService {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String APPLICATION_NAME = "Healthcare App";

    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final EncryptionUtil encryptionUtil;
    
    private final NetHttpTransport httpTransport;

    public GoogleCalendarService(
            @Value("${GOOGLE_CLIENT_ID:}") String clientId,
            @Value("${GOOGLE_CLIENT_SECRET:}") String clientSecret,
            @Value("${GOOGLE_REDIRECT_URI:}") String redirectUri,
            UserRepository userRepository,
            AppointmentRepository appointmentRepository,
            EncryptionUtil encryptionUtil) {
        
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.encryptionUtil = encryptionUtil;
        
        try {
            this.httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Google Http Transport", e);
        }
    }

    private GoogleAuthorizationCodeFlow getFlow() {
        return new GoogleAuthorizationCodeFlow.Builder(
                httpTransport, JSON_FACTORY, clientId, clientSecret,
                Collections.singleton(CalendarScopes.CALENDAR_EVENTS))
                .setAccessType("offline")
                .build();
    }

    public String getAuthorizationUrl(UUID userId) {
        AuthorizationCodeRequestUrl url = getFlow().newAuthorizationUrl()
                .setRedirectUri(redirectUri)
                .setState(userId.toString())
                .set("prompt", "consent");
        return url.build();
    }

    public void processOAuthCallback(String code, UUID userId) {
        try {
            TokenResponse response = getFlow().newTokenRequest(code)
                    .setRedirectUri(redirectUri)
                    .execute();
            
            User user = userRepository.findById(userId).orElseThrow();
            
            String encryptedAccessToken = encryptionUtil.encrypt(response.getAccessToken());
            user.setGoogleCalendarToken(encryptedAccessToken);
            
            if (response.getRefreshToken() != null) {
                String encryptedRefreshToken = encryptionUtil.encrypt(response.getRefreshToken());
                user.setGoogleCalendarRefreshToken(encryptedRefreshToken);
            }
            
            userRepository.save(user);
            log.info("Google Calendar connected for user {}", userId);
            
        } catch (Exception e) {
            log.error("Failed to process Google OAuth callback for user {}", userId, e);
            throw new RuntimeException("Failed to connect Google Calendar", e);
        }
    }

    private Calendar getCalendarService(User user) {
        if (user.getGoogleCalendarToken() == null) {
            return null;
        }

        try {
            String accessToken = encryptionUtil.decrypt(user.getGoogleCalendarToken());
            String refreshToken = null;
            if (user.getGoogleCalendarRefreshToken() != null) {
                refreshToken = encryptionUtil.decrypt(user.getGoogleCalendarRefreshToken());
            }

            Credential credential = new GoogleCredential.Builder()
                    .setTransport(httpTransport)
                    .setJsonFactory(JSON_FACTORY)
                    .setClientSecrets(clientId, clientSecret)
                    .build()
                    .setAccessToken(accessToken)
                    .setRefreshToken(refreshToken);

            return new Calendar.Builder(httpTransport, JSON_FACTORY, credential)
                    .setApplicationName(APPLICATION_NAME)
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to build Calendar service for user {}", user.getId(), e);
            return null;
        }
    }

    public String createCalendarEvent(UUID appointmentId, UUID userId) {
        try {
            User user = userRepository.findById(userId).orElseThrow();
            Calendar service = getCalendarService(user);
            if (service == null) return null;

            Appointment appointment = appointmentRepository.findById(appointmentId).orElseThrow();
            
            Event event = new Event()
                    .setSummary("Doctor Appointment - " + appointment.getDoctor().getUser().getFullName())
                    .setDescription("Healthcare Consultation");

            EventDateTime start = new EventDateTime()
                    .setDateTime(new DateTime(appointment.getSlotTime().atZone(ZoneId.of("UTC")).toInstant().toEpochMilli()));
            event.setStart(start);

            // Assuming a fixed 30-minute slot for now, as slotDurationMinutes isn't directly on Appointment
            EventDateTime end = new EventDateTime()
                    .setDateTime(new DateTime(appointment.getSlotTime().plusMinutes(30).atZone(ZoneId.of("UTC")).toInstant().toEpochMilli()));
            event.setEnd(end);

            Event createdEvent = service.events().insert("primary", event).execute();
            return createdEvent.getId();
            
        } catch (Exception e) {
            log.error("Failed to create calendar event for user {}", userId, e);
            return null;
        }
    }

    public void updateCalendarEvent(String eventId, LocalDateTime newSlotTime, UUID userId) {
        if (eventId == null) return;
        
        try {
            User user = userRepository.findById(userId).orElseThrow();
            Calendar service = getCalendarService(user);
            if (service == null) return;

            Event event = service.events().get("primary", eventId).execute();
            
            EventDateTime start = new EventDateTime()
                    .setDateTime(new DateTime(newSlotTime.atZone(ZoneId.of("UTC")).toInstant().toEpochMilli()));
            event.setStart(start);

            EventDateTime end = new EventDateTime()
                    .setDateTime(new DateTime(newSlotTime.plusMinutes(30).atZone(ZoneId.of("UTC")).toInstant().toEpochMilli()));
            event.setEnd(end);

            service.events().patch("primary", eventId, event).execute();
            
        } catch (Exception e) {
            log.error("Failed to update calendar event {} for user {}", eventId, userId, e);
        }
    }

    public void deleteCalendarEvent(String eventId, UUID userId) {
        if (eventId == null) return;
        
        try {
            User user = userRepository.findById(userId).orElseThrow();
            Calendar service = getCalendarService(user);
            if (service == null) return;

            service.events().delete("primary", eventId).execute();
            
        } catch (Exception e) {
            log.error("Failed to delete calendar event {} for user {}", eventId, userId, e);
        }
    }
}
