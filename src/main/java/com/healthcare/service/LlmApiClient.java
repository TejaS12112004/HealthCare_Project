package com.healthcare.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class LlmApiClient {

    private final WebClient webClient;
    private final String model;

    public LlmApiClient(
            @Value("${LLM_BASE_URL:https://api.openai.com/v1}") String baseUrl,
            @Value("${LLM_API_KEY:}") String apiKey,
            @Value("${LLM_MODEL:gpt-4o-mini}") String model,
            WebClient.Builder webClientBuilder) {
        
        this.model = model;
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000, multiplier = 2))
    public String generateCompletion(String prompt) {
        log.debug("Calling LLM API with prompt length: {}", prompt.length());
        
        Map<String, Object> requestBody = Map.of(
                "model", this.model,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a helpful medical assistant. Output only valid JSON without markdown formatting."),
                        Map.of("role", "user", "content", prompt)
                )
        );

        Map<String, Object> response = webClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        // Extract response: data.choices[0].message.content (OpenAI standard)
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");
        } catch (Exception e) {
            log.error("Failed to parse LLM response: {}", response);
            throw new RuntimeException("Invalid response format from LLM", e);
        }
    }
}
