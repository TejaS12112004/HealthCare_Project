package com.healthcare.config;

import com.healthcare.model.entity.PostVisitSummary;
import com.healthcare.model.entity.PreVisitSummary;
import com.healthcare.model.enums.LlmStatus;
import com.healthcare.repository.PostVisitSummaryRepository;
import com.healthcare.repository.PreVisitSummaryRepository;
import com.healthcare.service.LlmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.List;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class LlmRetryScheduler {

    private final PreVisitSummaryRepository preVisitSummaryRepository;
    private final PostVisitSummaryRepository postVisitSummaryRepository;
    private final LlmService llmService;

    @Scheduled(cron = "0 */30 * * * *") // Every 30 minutes
    public void retryFailedSummaries() {
        log.info("Running background job to retry failed LLM summaries...");

        List<PreVisitSummary> failedPreVisits = preVisitSummaryRepository.findByLlmStatusAndRetryCountLessThan(LlmStatus.FAILED, 3);
        for (PreVisitSummary pvs : failedPreVisits) {
            log.info("Retrying pre-visit summary for appointment {}", pvs.getAppointment().getId());
            llmService.generatePreVisitSummary(pvs.getAppointment().getId());
        }

        List<PostVisitSummary> failedPostVisits = postVisitSummaryRepository.findByLlmStatusAndRetryCountLessThan(LlmStatus.FAILED, 3);
        for (PostVisitSummary pvs : failedPostVisits) {
            log.info("Retrying post-visit summary for appointment {}", pvs.getAppointment().getId());
            llmService.generatePostVisitSummary(pvs.getAppointment().getId());
        }
    }
}
