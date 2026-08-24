package com.healthcare.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT utility — HS256 signing, claim extraction, and standalone validation.
 * Uses jjwt 0.12.x fluent API.
 *
 * <p>Token payload:
 * <pre>
 * {
 *   "sub"  : "user@example.com",
 *   "role" : "PATIENT",          ← single role string (not a list)
 *   "iat"  : 1234567890,
 *   "exp"  : 1234568790
 * }
 * </pre>
 */
@Slf4j
@Component
public class JwtUtil {

    private static final String ROLE_CLAIM = "role";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiry-ms}")
    private long expiryMs;

    @Value("${jwt.refresh-expiry-ms}")
    private long refreshExpiryMs;

    // ── Token generation ──────────────────────────────────────────────────────

    /**
     * Generates a short-lived access token.
     * Embeds the first granted authority as a single {@code "role"} claim (e.g. "ROLE_PATIENT").
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .ifPresent(role -> claims.put(ROLE_CLAIM, role));
        return buildToken(claims, userDetails.getUsername(), expiryMs);
    }

    /**
     * Generates a long-lived refresh token (no role claim — used only for re-issuance).
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

    // ── Token validation ──────────────────────────────────────────────────────

    /**
     * Validates the token against the given {@link UserDetails}: checks signature,
     * expiry, and subject match. Returns {@code false} (never throws) on any error.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String subject = extractEmail(token);
            return subject.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("JWT validation failed: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Standalone structural validation — verifies signature and expiry only,
     * without needing a {@link UserDetails} object. Returns {@code false} on any error.
     */
    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);           // throws if signature or expiry invalid
            return !isTokenExpired(token);
        } catch (ExpiredJwtException ex) {
            log.debug("JWT expired: {}", ex.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("JWT invalid: {}", ex.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ── Claim extraction ──────────────────────────────────────────────────────

    /** Returns the {@code sub} (email) claim. Alias for {@link #extractUsername}. */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /** @deprecated Prefer {@link #extractEmail(String)}. */
    @Deprecated
    public String extractUsername(String token) {
        return extractEmail(token);
    }

    /**
     * Returns the {@code role} claim string (e.g. {@code "ROLE_PATIENT"}).
     * Returns {@code null} for refresh tokens that carry no role claim.
     */
    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get(ROLE_CLAIM, String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

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
