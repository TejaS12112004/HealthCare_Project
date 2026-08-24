package com.healthcare.repository;

import com.healthcare.model.entity.User;
import com.healthcare.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for {@link User} entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    Optional<User> findByRefreshToken(String refreshToken);

    @Modifying
    @Query("UPDATE User u SET u.refreshToken = :token WHERE u.id = :id")
    void updateRefreshToken(@Param("id") Long id, @Param("token") String token);

    @Modifying
    @Query("UPDATE User u SET u.isActive = :active WHERE u.id = :id")
    void updateActiveStatus(@Param("id") Long id, @Param("active") Boolean active);

    long countByRole(Role role);

    long countByIsActive(Boolean isActive);
}
