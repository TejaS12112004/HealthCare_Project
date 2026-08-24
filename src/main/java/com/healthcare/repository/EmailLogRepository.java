package com.healthcare.repository;

import com.healthcare.model.entity.EmailLog;
import com.healthcare.model.enums.EmailStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {

    List<EmailLog> findByStatus(EmailStatus status);

    /** Fetch retryable emails: PENDING or FAILED with retryCount < maxRetries. */
    @Query("""
           SELECT e FROM EmailLog e
           WHERE e.status IN ('PENDING', 'FAILED')
           AND e.retryCount < :maxRetries
           ORDER BY e.createdAt ASC
           """)
    List<EmailLog> findRetryable(@Param("maxRetries") int maxRetries);

    @Modifying
    @Query("""
           UPDATE EmailLog e
           SET e.status = :status, e.sentAt = :sentAt, e.errorMessage = :error,
               e.retryCount = e.retryCount + 1
           WHERE e.id = :id
           """)
    void updateStatus(@Param("id") UUID id,
                      @Param("status") EmailStatus status,
                      @Param("sentAt") LocalDateTime sentAt,
                      @Param("error") String error);
}
