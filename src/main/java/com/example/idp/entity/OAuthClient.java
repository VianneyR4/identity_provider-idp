package com.example.idp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "oauth_clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OAuthClient {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "client_id", unique = true, nullable = false)
    private String clientId;
    
    @Column(name = "client_secret_hash", nullable = false)
    private String clientSecretHash;
    
    @Column(name = "client_name", nullable = false)
    private String clientName;
    
    @ElementCollection
    @CollectionTable(name = "client_redirect_uris", joinColumns = @JoinColumn(name = "client_id"))
    @Column(name = "redirect_uri")
    private List<String> redirectUris;
    
    @ElementCollection
    @CollectionTable(name = "client_scopes", joinColumns = @JoinColumn(name = "client_id"))
    @Column(name = "scope")
    private List<String> scopes;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<RefreshToken> refreshTokens = new HashSet<>();
    
    // Helper methods
    public boolean isRedirectUriValid(String redirectUri) {
        return redirectUris != null && redirectUris.contains(redirectUri);
    }
    
    public boolean hasScopeAccess(String scope) {
        return scopes != null && scopes.contains(scope);
    }
}
