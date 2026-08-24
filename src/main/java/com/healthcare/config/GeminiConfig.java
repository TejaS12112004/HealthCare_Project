package com.healthcare.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Strongly-typed binding for {@code gemini.*} properties.
 *
 * <pre>
 * gemini:
 *   api-key: ${GEMINI_API_KEY}
 * </pre>
 *
 * Inject this bean in any service that needs to call the Gemini API.
 */
@Configuration
@ConfigurationProperties(prefix = "gemini")
public class GeminiConfig {

    /** Google Gemini API key (from env var {@code GEMINI_API_KEY}). */
    private String apiKey;

    public String getApiKey() { return apiKey; }
    public void   setApiKey(String apiKey) { this.apiKey = apiKey; }
}
