package com.example.idp.repository;

import com.example.idp.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    
    List<RefreshToken> findByUserId(Long userId);
    
    List<RefreshToken> findByUserIdAndClientClientId(Long userId, String clientId);
    
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash AND rt.isRevoked = false AND rt.expiresAt > :now")
    Optional<RefreshToken> findValidToken(@Param("tokenHash") String tokenHash, @Param("now") LocalDateTime now);
    
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true WHERE rt.user.id = :userId")
    void revokeAllTokensForUser(@Param("userId") Long userId);
    
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true WHERE rt.user.id = :userId AND rt.client.clientId = :clientId")
    void revokeTokensForUserAndClient(@Param("userId") Long userId, @Param("clientId") String clientId);
    
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now OR rt.isRevoked = true")
    void deleteExpiredAndRevokedTokens(@Param("now") LocalDateTime now);
    
    long countByUserIdAndIsRevokedFalse(Long userId);
}
