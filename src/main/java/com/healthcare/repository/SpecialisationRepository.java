package com.healthcare.repository;

import com.healthcare.model.entity.Specialisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpecialisationRepository extends JpaRepository<Specialisation, UUID> {
    Optional<Specialisation> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
