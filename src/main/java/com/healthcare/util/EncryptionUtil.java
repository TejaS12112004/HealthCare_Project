package com.healthcare.util;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;

    @Value("${CALENDAR_ENCRYPTION_KEY:}")
    private String calendarEncryptionKey;

    private SecretKeySpec secretKey;

    @PostConstruct
    public void validateKey() {
        if (calendarEncryptionKey == null || calendarEncryptionKey.isBlank()) {
            log.warn("CALENDAR_ENCRYPTION_KEY is missing. Google Calendar token encryption will fail if invoked.");
            return;
        }

        byte[] keyBytes = Base64.getDecoder().decode(calendarEncryptionKey);
        if (keyBytes.length != 32) {
            throw new IllegalStateException("CALENDAR_ENCRYPTION_KEY must decode to exactly 32 bytes");
        }
        
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
        log.info("EncryptionUtil initialized successfully.");
    }

    public String encrypt(String plainText) {
        if (plainText == null) return null;
        if (secretKey == null) throw new IllegalStateException("Encryption key not configured");

        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);
            
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            // Combine IV and cipherText
            byte[] encryptedData = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, encryptedData, 0, iv.length);
            System.arraycopy(cipherText, 0, encryptedData, iv.length, cipherText.length);
            
            return Base64.getEncoder().encodeToString(encryptedData);
            
        } catch (Exception e) {
            throw new RuntimeException("Error while encrypting data", e);
        }
    }

    public String decrypt(String encryptedText) {
        if (encryptedText == null) return null;
        if (secretKey == null) throw new IllegalStateException("Encryption key not configured");

        try {
            byte[] encryptedData = Base64.getDecoder().decode(encryptedText);
            
            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(encryptedData, 0, iv, 0, iv.length);
            
            byte[] cipherText = new byte[encryptedData.length - iv.length];
            System.arraycopy(encryptedData, iv.length, cipherText, 0, cipherText.length);
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);
            
            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            throw new RuntimeException("Error while decrypting data", e);
        }
    }
}
