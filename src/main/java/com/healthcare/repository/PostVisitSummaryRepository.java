package com.healthcare.repository;

import com.healthcare.model.entity.PostVisitSummary;
import com.healthcare.model.enums.LlmStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostVisitSummaryRepository extends JpaRepository<PostVisitSummary, UUID> {

    Optional<PostVisitSummary> findByAppointmentId(UUID appointmentId);

    List<PostVisitSummary> findByLlmStatusAndRetryCountLessThan(LlmStatus status, Integer maxRetries);

    @Query("""
           SELECT p FROM PostVisitSummary p
           WHERE p.llmStatus IN ('PENDING', 'FAILED')
           AND p.retryCount < :maxRetries
           ORDER BY p.createdAt ASC
           """)
    List<PostVisitSummary> findRetryable(@Param("maxRetries") int maxRetries);
}
