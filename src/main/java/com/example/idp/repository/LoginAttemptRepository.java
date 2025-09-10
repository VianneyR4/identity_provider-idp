package com.example.idp.repository;

import com.example.idp.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    
    List<LoginAttempt> findByEmailOrderByAttemptedAtDesc(String email);
    
    List<LoginAttempt> findByIpAddressOrderByAttemptedAtDesc(String ipAddress);
    
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.email = :email AND la.success = false AND la.attemptedAt > :since")
    long countFailedAttemptsByEmailSince(@Param("email") String email, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ipAddress AND la.success = false AND la.attemptedAt > :since")
    long countFailedAttemptsByIpSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);
    
    @Query("SELECT la FROM LoginAttempt la WHERE la.email = :email AND la.attemptedAt > :since ORDER BY la.attemptedAt DESC")
    List<LoginAttempt> findRecentAttemptsByEmail(@Param("email") String email, @Param("since") LocalDateTime since);
    
    void deleteByAttemptedAtBefore(LocalDateTime cutoff);
}
