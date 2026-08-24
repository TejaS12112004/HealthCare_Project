package com.healthcare.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Strongly-typed binding for {@code google.calendar.*} properties.
 *
 * <pre>
 * google:
 *   calendar:
 *     client-id: ${GOOGLE_CLIENT_ID}
 *     client-secret: ${GOOGLE_CLIENT_SECRET}
 *     redirect-uri: ${GOOGLE_REDIRECT_URI}
 *     scopes:
 *       - https://www.googleapis.com/auth/calendar
 *       - https://www.googleapis.com/auth/calendar.events
 * </pre>
 */
@Configuration
@ConfigurationProperties(prefix = "google.calendar")
public class GoogleCalendarConfig {

    private String       clientId;
    private String       clientSecret;
    private String       redirectUri;
    private List<String> scopes;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String       getClientId()     { return clientId; }
    public void         setClientId(String clientId) { this.clientId = clientId; }

    public String       getClientSecret() { return clientSecret; }
    public void         setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }

    public String       getRedirectUri()  { return redirectUri; }
    public void         setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }

    public List<String> getScopes()       { return scopes; }
    public void         setScopes(List<String> scopes) { this.scopes = scopes; }
}
