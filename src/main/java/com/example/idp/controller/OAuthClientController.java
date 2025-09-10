package com.example.idp.controller;

import com.example.idp.dto.ApiResponse;
import com.example.idp.entity.OAuthClient;
import com.example.idp.repository.OAuthClientRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/oauth/clients")
@RequiredArgsConstructor
@Slf4j
public class OAuthClientController {

    private final OAuthClientRepository oauthClientRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping
    public ResponseEntity<ApiResponse<CreateOAuthClientResponse>> createClient(@Valid @RequestBody CreateOAuthClientRequest request) {
        try {
            log.info("Creating OAuth client: {}", request.getClientName());

            // Auto-generate client ID and secret
            String clientId = generateClientId(request.getClientName());
            String clientSecret = generateClientSecret();
            
            // Ensure client ID is unique
            String uniqueClientId = ensureUniqueClientId(clientId);

            // Create new OAuth client with defaults
            OAuthClient client = OAuthClient.builder()
                .clientId(uniqueClientId)
                .clientSecretHash(passwordEncoder.encode(clientSecret))
                .clientName(request.getClientName())
                .redirectUris(List.of("http://localhost:3000/auth/callback")) // Default redirect URI
                .scopes(List.of("read", "write", "profile")) // Default scopes
                .isActive(true)
                .build();

            OAuthClient savedClient = oauthClientRepository.save(client);
            
            // Return the plain client secret only once during creation
            CreateOAuthClientResponse response = new CreateOAuthClientResponse();
            response.setId(savedClient.getId());
            response.setClientId(savedClient.getClientId());
            response.setClientSecret(clientSecret); // Plain secret returned only once
            response.setClientName(savedClient.getClientName());
            response.setRedirectUris(savedClient.getRedirectUris());
            response.setScopes(savedClient.getScopes());
            response.setIsActive(savedClient.getIsActive());
            response.setCreatedAt(savedClient.getCreatedAt());
            
            log.info("OAuth client created successfully: {}", savedClient.getClientId());
            return ResponseEntity.ok(ApiResponse.success("OAuth client created successfully", response));

        } catch (Exception e) {
            log.error("Error creating OAuth client", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to create OAuth client: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OAuthClient>>> getAllClients() {
        try {
            List<OAuthClient> clients = oauthClientRepository.findAll();
            
            // Hide client secrets in response
            clients.forEach(client -> client.setClientSecretHash("[HIDDEN]"));
            
            return ResponseEntity.ok(ApiResponse.success("OAuth clients retrieved successfully", clients));
        } catch (Exception e) {
            log.error("Error retrieving OAuth clients", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to retrieve OAuth clients: " + e.getMessage()));
        }
    }

    @GetMapping("/{clientId}")
    public ResponseEntity<ApiResponse<OAuthClient>> getClient(@PathVariable String clientId) {
        try {
            Optional<OAuthClient> client = oauthClientRepository.findByClientId(clientId);
            
            if (client.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Hide client secret in response
            OAuthClient foundClient = client.get();
            foundClient.setClientSecretHash("[HIDDEN]");
            
            return ResponseEntity.ok(ApiResponse.success("OAuth client retrieved successfully", foundClient));
        } catch (Exception e) {
            log.error("Error retrieving OAuth client: {}", clientId, e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to retrieve OAuth client: " + e.getMessage()));
        }
    }

    @PutMapping("/{clientId}")
    public ResponseEntity<ApiResponse<OAuthClient>> updateClient(
            @PathVariable String clientId,
            @Valid @RequestBody UpdateOAuthClientRequest request) {
        try {
            Optional<OAuthClient> existingClient = oauthClientRepository.findByClientId(clientId);
            
            if (existingClient.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            OAuthClient client = existingClient.get();
            client.setClientName(request.getClientName());
            client.setRedirectUris(request.getRedirectUris());
            client.setScopes(request.getScopes());
            client.setIsActive(request.getIsActive());
            
            // Update client secret if provided
            if (request.getClientSecret() != null && !request.getClientSecret().trim().isEmpty()) {
                client.setClientSecretHash(passwordEncoder.encode(request.getClientSecret()));
            }
            
            OAuthClient updatedClient = oauthClientRepository.save(client);
            updatedClient.setClientSecretHash("[HIDDEN]");
            
            log.info("OAuth client updated successfully: {}", clientId);
            return ResponseEntity.ok(ApiResponse.success("OAuth client updated successfully", updatedClient));

        } catch (Exception e) {
            log.error("Error updating OAuth client: {}", clientId, e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to update OAuth client: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{clientId}")
    public ResponseEntity<ApiResponse<Void>> deleteClient(@PathVariable String clientId) {
        try {
            Optional<OAuthClient> client = oauthClientRepository.findByClientId(clientId);
            
            if (client.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            oauthClientRepository.delete(client.get());
            
            log.info("OAuth client deleted successfully: {}", clientId);
            return ResponseEntity.ok(ApiResponse.success("OAuth client deleted successfully", null));

        } catch (Exception e) {
            log.error("Error deleting OAuth client: {}", clientId, e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to delete OAuth client: " + e.getMessage()));
        }
    }

    // Helper methods for client generation
    private String generateClientId(String clientName) {
        // Convert client name to kebab-case and add random suffix
        String baseId = clientName.toLowerCase()
            .replaceAll("[^a-z0-9\\s]", "")
            .replaceAll("\\s+", "-");
        
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        return baseId + "-" + randomSuffix;
    }

    private String generateClientSecret() {
        // Generate a secure random secret
        SecureRandom random = new SecureRandom();
        StringBuilder secret = new StringBuilder();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        
        for (int i = 0; i < 32; i++) {
            secret.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return secret.toString();
    }

    private String ensureUniqueClientId(String baseClientId) {
        String clientId = baseClientId;
        int counter = 1;
        
        while (oauthClientRepository.findByClientId(clientId).isPresent()) {
            clientId = baseClientId + "-" + counter;
            counter++;
        }
        
        return clientId;
    }

    // Response DTOs
    public static class CreateOAuthClientResponse {
        private Long id;
        private String clientId;
        private String clientSecret;
        private String clientName;
        private List<String> redirectUris;
        private List<String> scopes;
        private Boolean isActive;
        private LocalDateTime createdAt;

        // Getters and setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }
        
        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
        
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        
        public List<String> getRedirectUris() { return redirectUris; }
        public void setRedirectUris(List<String> redirectUris) { this.redirectUris = redirectUris; }
        
        public List<String> getScopes() { return scopes; }
        public void setScopes(List<String> scopes) { this.scopes = scopes; }
        
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    // Request DTOs
    public static class CreateOAuthClientRequest {
        private String clientName;

        // Getters and setters
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
    }

    public static class UpdateOAuthClientRequest {
        private String clientSecret;
        private String clientName;
        private List<String> redirectUris;
        private List<String> scopes;
        private Boolean isActive;

        // Getters and setters
        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
        
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        
        public List<String> getRedirectUris() { return redirectUris; }
        public void setRedirectUris(List<String> redirectUris) { this.redirectUris = redirectUris; }
        
        public List<String> getScopes() { return scopes; }
        public void setScopes(List<String> scopes) { this.scopes = scopes; }
        
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }
}
