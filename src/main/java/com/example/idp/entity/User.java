package com.example.idp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;
import java.util.Collections;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "password_hash")
    private String passwordHash;
    
    @Column(name = "first_name", length = 100)
    private String firstName;
    
    @Column(name = "last_name", length = 100)
    private String lastName;
    
    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;
    
    @Column(name = "email_verification_token")
    private String emailVerificationToken;
    
    @Column(name = "email_verification_expires_at")
    private LocalDateTime emailVerificationExpiresAt;
    
    @Column(name = "password_reset_token")
    private String passwordResetToken;
    
    @Column(name = "password_reset_expires_at")
    private LocalDateTime passwordResetExpiresAt;
    
    @Column(name = "linkedin_id", unique = true)
    private String linkedinId;
    
    @Column(name = "google_id", unique = true)
    private String googleId;
    
    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<UserRole> roles = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<RefreshToken> refreshTokens = new HashSet<>();
    
    // Make sure collections are immutable when accessed
    public Set<UserRole> getRoles() {
        return Collections.unmodifiableSet(roles);
    }
    
    public Set<RefreshToken> getRefreshTokens() {
        return Collections.unmodifiableSet(refreshTokens);
    }
    
    // Helper methods for bidirectional relationship management
    public void addRole(UserRole role) {
        roles.add(role);
        role.setUser(this);
    }
    
    public void removeRole(UserRole role) {
        roles.remove(role);
        role.setUser(null);
    }
    
    public String getFullName() {
        if (firstName == null && lastName == null) {
            return email;
        }
        return String.format("%s %s", 
            firstName != null ? firstName : "", 
            lastName != null ? lastName : "").trim();
    }
    
    public boolean hasRole(String roleName) {
        // Create a defensive copy to avoid ConcurrentModificationException
        return new HashSet<>(roles).stream()
                .anyMatch(role -> role.getRole().equals(roleName));
    }
}
