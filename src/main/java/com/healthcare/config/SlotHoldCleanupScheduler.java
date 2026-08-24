package com.healthcare.config;

import com.healthcare.repository.SlotHoldRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class SlotHoldCleanupScheduler {

    private final SlotHoldRepository slotHoldRepository;

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    @Transactional
    public void cleanupExpiredHolds() {
        LocalDateTime now = LocalDateTime.now();
        int releasedCount = slotHoldRepository.releaseExpiredHolds(now);
        if (releasedCount > 0) {
            log.info("Released {} expired slot holds", releasedCount);
        }
    }
}
