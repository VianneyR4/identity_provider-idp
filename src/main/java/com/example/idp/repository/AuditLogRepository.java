package com.example.idp.repository;

import com.example.idp.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<AuditLog> findByEventTypeOrderByCreatedAtDesc(String eventType);
    
    @Query("SELECT al FROM AuditLog al WHERE al.user.id = :userId AND al.eventType = :eventType ORDER BY al.createdAt DESC")
    List<AuditLog> findByUserIdAndEventType(@Param("userId") Long userId, @Param("eventType") String eventType);
    
    @Query("SELECT al FROM AuditLog al WHERE al.createdAt >= :since ORDER BY al.createdAt DESC")
    List<AuditLog> findRecentLogs(@Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(al) FROM AuditLog al WHERE al.eventType = :eventType AND al.createdAt >= :since")
    long countByEventTypeSince(@Param("eventType") String eventType, @Param("since") LocalDateTime since);
    
    void deleteByCreatedAtBefore(LocalDateTime cutoff);
}
