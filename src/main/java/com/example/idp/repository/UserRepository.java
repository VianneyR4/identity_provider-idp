package com.example.idp.repository;

import com.example.idp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByLinkedinId(String linkedinId);
    
    Optional<User> findByGoogleId(String googleId);
    
    Optional<User> findByEmailVerificationToken(String token);
    
    Optional<User> findByPasswordResetToken(String token);
    
    boolean existsByEmail(String email);
    
    boolean existsByLinkedinId(String linkedinId);
    
    @Query("SELECT u FROM User u WHERE u.emailVerificationToken = :token AND u.emailVerificationExpiresAt > :now")
    Optional<User> findByValidEmailVerificationToken(@Param("token") String token, @Param("now") LocalDateTime now);
    
    @Query("SELECT u FROM User u WHERE u.passwordResetToken = :token AND u.passwordResetExpiresAt > :now")
    Optional<User> findByValidPasswordResetToken(@Param("token") String token, @Param("now") LocalDateTime now);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since")
    long countUsersRegisteredSince(@Param("since") LocalDateTime since);
}
