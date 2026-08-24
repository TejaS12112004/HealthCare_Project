package com.healthcare.config;

import com.healthcare.model.entity.User;
import com.healthcare.model.enums.Role;
import com.healthcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        String adminEmail = "tekadet10@gmail.com";
        String adminPassword = "admin@123";

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .firstName("System")
                    .lastName("Administrator")
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .isActive(true)
                    .isEmailVerified(true)
                    .build();

            userRepository.save(admin);
            log.info("Created default admin account: {}", adminEmail);
        } else {
            log.info("Admin account {} already exists.", adminEmail);
        }
    }
}
