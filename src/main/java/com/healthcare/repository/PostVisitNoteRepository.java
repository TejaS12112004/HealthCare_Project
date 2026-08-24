package com.healthcare.repository;

import com.healthcare.model.entity.PostVisitNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostVisitNoteRepository extends JpaRepository<PostVisitNote, UUID> {
    Optional<PostVisitNote> findByAppointmentId(UUID appointmentId);
    boolean existsByAppointmentId(UUID appointmentId);
}
