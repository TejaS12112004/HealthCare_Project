package com.healthcare.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Strongly-typed binding for {@code jwt.*} properties in {@code application.yml}.
 *
 * <p>Inject this bean wherever you need JWT configuration values instead of
 * scattering {@code @Value} annotations.
 *
 * <pre>
 * jwt:
 *   secret: ${JWT_SECRET}
 *   expiry-ms: ${JWT_EXPIRY_MS:900000}
 *   refresh-expiry-ms: ${JWT_REFRESH_EXPIRY_MS:604800000}
 * </pre>
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    /** Base-64 encoded HMAC-SHA secret used to sign tokens. */
    private String secret;

    /** Access-token lifetime in milliseconds (default: 15 minutes). */
    private long expiryMs = 900_000L;

    /** Refresh-token lifetime in milliseconds (default: 7 days). */
    private long refreshExpiryMs = 604_800_000L;

    // ── Getters & Setters ─────────────────────────────────────────────────────
    // (Lombok @Data omitted intentionally; record-style setters required by
    //  Spring's ConfigurationProperties binder.)

    public String getSecret() { return secret; }
    public void   setSecret(String secret) { this.secret = secret; }

    public long getExpiryMs() { return expiryMs; }
    public void setExpiryMs(long expiryMs) { this.expiryMs = expiryMs; }

    public long getRefreshExpiryMs() { return refreshExpiryMs; }
    public void setRefreshExpiryMs(long refreshExpiryMs) { this.refreshExpiryMs = refreshExpiryMs; }
}
