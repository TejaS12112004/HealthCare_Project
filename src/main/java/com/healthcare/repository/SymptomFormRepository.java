package com.healthcare.repository;

import com.healthcare.model.entity.SymptomForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SymptomFormRepository extends JpaRepository<SymptomForm, UUID> {
    Optional<SymptomForm> findByAppointmentId(UUID appointmentId);
    boolean existsByAppointmentId(UUID appointmentId);
}
