package com.healthcare.repository;

import com.healthcare.model.entity.PreVisitSummary;
import com.healthcare.model.enums.LlmStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PreVisitSummaryRepository extends JpaRepository<PreVisitSummary, UUID> {

    Optional<PreVisitSummary> findByAppointmentId(UUID appointmentId);

    /** Fetch pending/failed summaries eligible for LLM retry. */
    @Query("""
           SELECT p FROM PreVisitSummary p
           WHERE p.llmStatus IN ('PENDING', 'FAILED')
           AND p.retryCount < :maxRetries
           ORDER BY p.createdAt ASC
           """)
    List<PreVisitSummary> findRetryable(@Param("maxRetries") int maxRetries);
}
