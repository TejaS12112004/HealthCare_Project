package com.healthcare;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Basic smoke test — verifies that the Spring application context loads
 * without errors.
 *
 * <p>Uses {@code @TestPropertySource} to supply the mandatory environment
 * variables (JWT_SECRET, DB_URL, etc.) with safe test values so that the
 * context can start in isolation without a real database or Flyway migration.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "DB_URL=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "DB_USERNAME=sa",
    "DB_PASSWORD=",
    "JWT_SECRET=dGVzdC1zZWNyZXQta2V5LXRoYXQtaXMtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw==",
    "JWT_EXPIRY_MS=900000",
    "JWT_REFRESH_EXPIRY_MS=604800000",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class HealthcareApplicationTests {

    @Test
    void contextLoads() {
        // If this test passes, the Spring context started successfully.
    }
}
