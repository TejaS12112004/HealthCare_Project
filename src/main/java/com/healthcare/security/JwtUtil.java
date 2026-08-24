package com.healthcare.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility for creating, signing, and validating JWT access and refresh tokens.
 * Uses HMAC-SHA-256 via the jjwt 0.12.x API.
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiry-ms}")
    private long expiryMs;

    @Value("${jwt.refresh-expiry-ms}")
    private long refreshExpiryMs;

    // ───────────────────────────────────────────────────────────────────────────
    //  Token generation
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Generates a short-lived access token for the given user details.
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        // include authorities so downstream services can inspect them
        claims.put("roles", userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority()).toList());
        return buildToken(claims, userDetails.getUsername(), expiryMs);
    }

    /**
     * Generates a long-lived refresh token.
     */
    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails.getUsername(), refreshExpiryMs);
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long ttlMs) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttlMs))
                .signWith(getSigningKey())
                .compact();
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  Token validation
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Returns true when the token is structurally valid, unexpired, and the
     * subject matches the supplied {@link UserDetails}.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String subject = extractUsername(token);
            return subject.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("JWT validation failed: {}", ex.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  Claim extraction helpers
    // ───────────────────────────────────────────────────────────────────────────

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
