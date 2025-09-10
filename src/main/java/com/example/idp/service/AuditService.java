package com.example.idp.service;

import com.example.idp.entity.AuditLog;
import com.example.idp.entity.User;
import com.example.idp.repository.AuditLogRepository;
import com.example.idp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {
    
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEventAsync(Long userId, String eventType, String description, 
                             String ipAddress, String userAgent) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .eventType(eventType)
                .description(description)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
            
            // Only set user reference if userId exists and user is found in database
            if (userId != null && userRepository.existsById(userId)) {
                User user = new User();
                user.setId(userId); // Create proxy reference
                auditLog.setUser(user);
            }
            
            auditLogRepository.save(auditLog);
            log.debug("Audit event logged asynchronously: {} for user: {}", eventType, userId);
            
        } catch (Exception e) {
            log.error("Async audit logging failed for event: {} and user: {}", eventType, userId, e);
            // Don't rethrow - audit failures shouldn't break the main flow
        }
    }
    
    // Synchronous version for critical events that must be logged immediately
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(Long userId, String eventType, String description, 
                        String ipAddress, String userAgent) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .eventType(eventType)
                .description(description)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
            
            // Only set user reference if userId exists and user is found in database
            if (userId != null && userRepository.existsById(userId)) {
                User user = new User();
                user.setId(userId); // Create proxy reference
                auditLog.setUser(user);
            } else if (userId != null) {
                log.warn("User with ID {} not found, logging audit event without user reference", userId);
            }
            
            auditLogRepository.save(auditLog);
            log.debug("Audit event logged: {} for user: {}", eventType, userId);
            
        } catch (Exception e) {
            log.error("Failed to log audit event: {} for user: {}", eventType, userId, e);
            // Don't rethrow the exception to avoid breaking the main flow
        }
    }
}
