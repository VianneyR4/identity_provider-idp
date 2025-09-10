package com.example.idp.service;

import com.example.idp.entity.User;
import com.example.idp.entity.UserRole;
import com.example.idp.repository.UserRepository;
import com.example.idp.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;
    
    @Transactional
    public User registerUser(String email, String password, String firstName, String lastName) {
        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }
        
        // Create user
        User user = User.builder()
                .email(email.toLowerCase())
                .passwordHash(passwordEncoder.encode(password))
                .firstName(firstName)
                .lastName(lastName)
                .emailVerified(false)
                .emailVerificationToken(UUID.randomUUID().toString())
                .emailVerificationExpiresAt(LocalDateTime.now().plusHours(24))
                .isActive(true)
                .build();
        
        user = userRepository.saveAndFlush(user);
        
        // Assign default USER role
        UserRole userRole = UserRole.builder()
                .user(user)
                .role("USER")
                .build();
        userRoleRepository.save(userRole);
        
        // Send verification email (handle failures gracefully)
        try {
            emailService.sendVerificationEmail(user);
        } catch (Exception e) {
            log.warn("Failed to send verification email for user: {}, error: {}", email, e.getMessage());
            // Don't fail the registration if email sending fails
        }
        
        // Log registration (handle failures gracefully)
        try {
            auditService.logEvent(user.getId(), "REGISTRATION", 
                "User registered with email: " + email, null, null);
        } catch (Exception e) {
            log.warn("Failed to log registration event for user: {}, error: {}", email, e.getMessage());
            // Don't fail the registration if audit logging fails
        }
        
        log.info("User registered successfully: {}", email);
        return user;
    }
    
    @Transactional
    public User registerLinkedInOAuthUser(String email, String firstName, String lastName, 
                                         String linkedinId, String profilePictureUrl) {
        try {
            log.info("Processing LinkedIn OAuth for email: {}, linkedinId: {}", email, linkedinId);
            
            Optional<User> existingUser = userRepository.findByEmail(email.toLowerCase());
            
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                log.info("Found existing user: {}", user.getId());
                
                // Update LinkedIn info if not set
                if (user.getLinkedinId() == null && linkedinId != null) {
                    user.setLinkedinId(linkedinId);
                    if (user.getProfilePictureUrl() == null) {
                        user.setProfilePictureUrl(profilePictureUrl);
                    }
                }
                
                user.setLastLoginAt(LocalDateTime.now());
                User savedUser = userRepository.save(user);
                
                // Check and add USER role if missing
                ensureUserRole(savedUser);
                
                log.info("Updated existing user with LinkedIn OAuth: {}", savedUser.getId());
                return savedUser;
            }
            
            // Check if LinkedIn ID already exists (different email)
            Optional<User> linkedinUser = userRepository.findByLinkedinId(linkedinId);
            if (linkedinUser.isPresent()) {
                log.info("Found user with existing LinkedIn ID: {}", linkedinId);
                return linkedinUser.get();
            }
            
            // Create new user
            User newUser = User.builder()
                    .email(email.toLowerCase())
                    .firstName(firstName)
                    .lastName(lastName)
                    .linkedinId(linkedinId)
                    .profilePictureUrl(profilePictureUrl)
                    .emailVerified(true)
                    .isActive(true)
                    .lastLoginAt(LocalDateTime.now())
                    .build();
            
            User savedUser = userRepository.save(newUser);
            
            // Add default USER role
            ensureUserRole(savedUser);
            
            log.info("Created new LinkedIn OAuth user: {}", savedUser.getId());
            return savedUser;
            
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation in LinkedIn OAuth registration", e);
            throw new RuntimeException("User registration failed due to data conflict: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in LinkedIn OAuth registration", e);
            throw new RuntimeException("Failed to register LinkedIn OAuth user: " + e.getMessage());
        }
    }

    @Transactional
    public User registerOAuthUser(String email, String firstName, String lastName, 
                                 String linkedinId, String profilePictureUrl) {
        // Delegate to the new LinkedIn-specific method
        return registerLinkedInOAuthUser(email, firstName, lastName, linkedinId, profilePictureUrl);
    }

    @Transactional
    public User registerGoogleOAuthUser(String email, String name, String googleId, String profilePictureUrl) {
        try {
            log.info("Processing Google OAuth for email: {}, googleId: {}", email, googleId);
            
            Optional<User> existingUser = userRepository.findByEmail(email.toLowerCase());
            
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                log.info("Found existing user: {}", user.getId());
                
                // Update Google info if not set
                if (user.getGoogleId() == null && googleId != null) {
                    user.setGoogleId(googleId);
                    if (user.getProfilePictureUrl() == null) {
                        user.setProfilePictureUrl(profilePictureUrl);
                    }
                }
                
                user.setLastLoginAt(LocalDateTime.now());
                User savedUser = userRepository.save(user);
                
                // Check and add USER role if missing
                ensureUserRole(savedUser);
                
                log.info("Updated existing user with Google OAuth: {}", savedUser.getId());
                return savedUser;
            }
            
            // Check if Google ID already exists (different email)
            Optional<User> googleUser = userRepository.findByGoogleId(googleId);
            if (googleUser.isPresent()) {
                log.info("Found user with existing Google ID: {}", googleId);
                return googleUser.get();
            }
            
            // Create new user
            String[] nameParts = name.split(" ", 2);
            String firstName = nameParts[0];
            String lastName = nameParts.length > 1 ? nameParts[1] : "";
            
            User newUser = User.builder()
                    .email(email.toLowerCase())
                    .firstName(firstName)
                    .lastName(lastName)
                    .googleId(googleId)
                    .profilePictureUrl(profilePictureUrl)
                    .emailVerified(true)
                    .isActive(true)
                    .lastLoginAt(LocalDateTime.now())
                    .build();
            
            User savedUser = userRepository.save(newUser);
            
            // Add default USER role
            ensureUserRole(savedUser);
            
            log.info("Created new Google OAuth user: {}", savedUser.getId());
            return savedUser;
            
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation in Google OAuth registration", e);
            throw new RuntimeException("User registration failed due to data conflict: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in Google OAuth registration", e);
            throw new RuntimeException("Failed to register Google OAuth user: " + e.getMessage());
        }
    }

    private void ensureUserRole(User user) {
        if (!userRoleRepository.existsByUserIdAndRole(user.getId(), "USER")) {
            UserRole userRole = UserRole.builder()
                    .user(user)
                    .role("USER")
                    .build();
            userRoleRepository.save(userRole);
            log.info("Added USER role to user: {}", user.getId());
        }
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase());
    }
    
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> findByLinkedinId(String linkedinId) {
        return userRepository.findByLinkedinId(linkedinId);
    }
    
    public boolean validatePassword(User user, String password) {
        if (user.getPasswordHash() == null) {
            return false; // OAuth-only user
        }
        return passwordEncoder.matches(password, user.getPasswordHash());
    }
    
    @Transactional
    public boolean verifyEmail(String token) {
        Optional<User> userOpt = userRepository.findByValidEmailVerificationToken(
            token, LocalDateTime.now());
        
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        Long userId = user.getId();
        String userEmail = user.getEmail();
        
        // Update user verification status
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        
        // Save user first to avoid concurrent modification issues
        userRepository.saveAndFlush(user);
        
        // TODO: Re-enable audit logging after fixing concurrent modification issue
        // Temporarily disabled to prevent ConcurrentModificationException
        log.info("Email verification audit logging temporarily disabled for user: {}", userId);
        
        log.info("Email verified for user: {}", userEmail);
        return true;
    }
    
    @Transactional
    public void initiatePasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email.toLowerCase());
        if (userOpt.isEmpty()) {
            // Don't reveal if email exists
            log.warn("Password reset requested for non-existent email: {}", email);
            return;
        }
        
        User user = userOpt.get();
        user.setPasswordResetToken(UUID.randomUUID().toString());
        user.setPasswordResetExpiresAt(LocalDateTime.now().plusHours(1));
        userRepository.saveAndFlush(user);
        
        emailService.sendPasswordResetEmail(user);
        
        // Log password reset request
        auditService.logEvent(user.getId(), "PASSWORD_RESET_REQUEST", 
            "Password reset requested", null, null);
        
        log.info("Password reset initiated for user: {}", email);
    }
    
    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        Optional<User> userOpt = userRepository.findByValidPasswordResetToken(
            token, LocalDateTime.now());
        
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.saveAndFlush(user);
        
        // Log password reset
        auditService.logEvent(user.getId(), "PASSWORD_RESET", 
            "Password reset successfully", null, null);
        
        log.info("Password reset completed for user: {}", user.getEmail());
        return true;
    }
    
    @Transactional
    public void updateLastLogin(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.saveAndFlush(user);
        });
    }
    
    @Transactional
    public void addRoleToUser(Long userId, String role) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, role)) {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            UserRole userRole = UserRole.builder()
                .user(user)
                .role(role)
                .build();
            userRoleRepository.save(userRole);
            
            log.info("Role {} added to user {}", role, userId);
        }
    }
    
    @Transactional
    public void removeRoleFromUser(Long userId, String role) {
        userRoleRepository.deleteByUserIdAndRole(userId, role);
        log.info("Role {} removed from user {}", role, userId);
    }
}
