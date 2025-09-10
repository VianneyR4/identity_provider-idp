package com.example.idp.service;

import com.example.idp.entity.User;
import com.example.idp.entity.LoginAttempt;
import com.example.idp.entity.RefreshToken;
import com.example.idp.entity.OAuthClient;
import com.example.idp.repository.LoginAttemptRepository;
import com.example.idp.repository.RefreshTokenRepository;
import com.example.idp.repository.OAuthClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {
    
    private final UserService userService;
    private final JwtService jwtService;
    private final LoginAttemptRepository loginAttemptRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OAuthClientRepository oauthClientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;
    
    @Transactional
    public AuthenticationResult authenticateUser(String email, String password, 
                                               String clientId, String ipAddress, String userAgent) {
        // Check if account is locked
        if (isAccountLocked(email)) {
            recordLoginAttempt(email, false, ipAddress, userAgent);
            return AuthenticationResult.failure("Account temporarily locked due to too many failed attempts");
        }
        
        // Validate client
        OAuthClient client = validateClient(clientId);
        if (client == null) {
            return AuthenticationResult.failure("Invalid client");
        }
        
        // Find user
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) {
            recordLoginAttempt(email, false, ipAddress, userAgent);
            return AuthenticationResult.failure("Invalid credentials");
        }
        
        User user = userOpt.get();
        
        // Check if user is active
        if (!user.getIsActive()) {
            recordLoginAttempt(email, false, ipAddress, userAgent);
            return AuthenticationResult.failure("Account is deactivated");
        }
        
        // Check if email is verified
        if (!user.getEmailVerified()) {
            recordLoginAttempt(email, false, ipAddress, userAgent);
            return AuthenticationResult.failure("Email not verified");
        }
        
        // Validate password
        if (!userService.validatePassword(user, password)) {
            recordLoginAttempt(email, false, ipAddress, userAgent);
            return AuthenticationResult.failure("Invalid credentials");
        }
        
        // Successful authentication
        recordLoginAttempt(email, true, ipAddress, userAgent);
        userService.updateLastLogin(user.getId());
        
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user, clientId);
        String refreshToken = generateAndStoreRefreshToken(user, client);
        
        // Log successful login
        auditService.logEvent(user.getId(), "LOGIN", 
            "Successful login", ipAddress, userAgent);
        
        log.info("User authenticated successfully: {}", email);
        return AuthenticationResult.success(accessToken, refreshToken, user);
    }
    
    @Transactional
    public AuthenticationResult authenticateOAuthUser(String email, String firstName, String lastName,
                                                    String linkedinId, String profilePictureUrl,
                                                    String clientId, String ipAddress, String userAgent) {
        // Validate client
        OAuthClient client = validateClient(clientId);
        if (client == null) {
            return AuthenticationResult.failure("Invalid client");
        }
        
        // Register or get existing OAuth user
        User user = userService.registerOAuthUser(email, firstName, lastName, linkedinId, profilePictureUrl);
        
        // Check if user is active
        if (!user.getIsActive()) {
            return AuthenticationResult.failure("Account is deactivated");
        }
        
        userService.updateLastLogin(user.getId());
        
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user, clientId);
        String refreshToken = generateAndStoreRefreshToken(user, client);
        
        // Log OAuth login
        auditService.logEvent(user.getId(), "OAUTH_LOGIN", 
            "Successful OAuth login", ipAddress, userAgent);
        
        log.info("OAuth user authenticated successfully: {}", email);
        return AuthenticationResult.success(accessToken, refreshToken, user);
    }
    
    @Transactional
    public RefreshTokenResult refreshAccessToken(String refreshTokenValue, String clientId) {
        // Validate client
        OAuthClient client = validateClient(clientId);
        if (client == null) {
            return RefreshTokenResult.failure("Invalid client");
        }
        
        // Hash the refresh token to find it in database
        String tokenHash = hashToken(refreshTokenValue);
        
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findValidToken(tokenHash, LocalDateTime.now());
        if (tokenOpt.isEmpty()) {
            return RefreshTokenResult.failure("Invalid or expired refresh token");
        }
        
        RefreshToken refreshToken = tokenOpt.get();
        
        // Verify client matches
        if (!refreshToken.getClient().getClientId().equals(clientId)) {
            return RefreshTokenResult.failure("Client mismatch");
        }
        
        User user = refreshToken.getUser();
        
        // Check if user is still active
        if (!user.getIsActive()) {
            refreshToken.revoke();
            refreshTokenRepository.save(refreshToken);
            return RefreshTokenResult.failure("Account is deactivated");
        }
        
        // Mark token as used
        refreshToken.markAsUsed();
        refreshTokenRepository.save(refreshToken);
        
        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(user, clientId);
        
        // Log token refresh
        auditService.logEvent(user.getId(), "TOKEN_REFRESH", 
            "Access token refreshed", null, null);
        
        return RefreshTokenResult.success(newAccessToken);
    }
    
    @Transactional
    public void logout(String refreshTokenValue, Long userId) {
        if (refreshTokenValue != null) {
            String tokenHash = hashToken(refreshTokenValue);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.revoke();
                refreshTokenRepository.save(token);
            });
        }
        
        if (userId != null) {
            auditService.logEvent(userId, "LOGOUT", "User logged out", null, null);
        }
    }
    
    @Transactional
    public void logoutAllSessions(Long userId) {
        refreshTokenRepository.revokeAllTokensForUser(userId);
        auditService.logEvent(userId, "LOGOUT_ALL", "All sessions logged out", null, null);
    }
    
    private OAuthClient validateClient(String clientId) {
        log.error("============= exception validateClient 1: {}", clientId);
        log.error("============= exception validateClient 2: {}", oauthClientRepository.findByClientIdAndIsActiveTrue(clientId).orElse(null));
        return oauthClientRepository.findByClientIdAndIsActiveTrue(clientId).orElse(null);
    }
    
    public boolean validateClientCredentials(String clientId, String clientSecret) {
        Optional<OAuthClient> clientOpt = oauthClientRepository.findByClientIdAndIsActiveTrue(clientId);
        if (clientOpt.isEmpty()) {
            return false;
        }
        
        OAuthClient client = clientOpt.get();
        return passwordEncoder.matches(clientSecret, client.getClientSecretHash());
    }
    
    private String generateAndStoreRefreshToken(User user, OAuthClient client) {
        String tokenValue = UUID.randomUUID().toString();
        String tokenHash = hashToken(tokenValue);
        
        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .client(client)
                .expiresAt(LocalDateTime.now().plusDays(7)) // 7 days expiration
                .build();
        
        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }
    
    private String hashToken(String token) {
        // For refresh tokens, we use a simple hash since we need to find them in DB
        // In production, consider using a more sophisticated approach
        return String.valueOf(token.hashCode());
    }
    
    private boolean isAccountLocked(String email) {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(LOCKOUT_DURATION_MINUTES);
        long failedAttempts = loginAttemptRepository.countFailedAttemptsByEmailSince(email, cutoff);
        return failedAttempts >= MAX_LOGIN_ATTEMPTS;
    }
    
    private void recordLoginAttempt(String email, boolean success, String ipAddress, String userAgent) {
        LoginAttempt attempt = LoginAttempt.builder()
                .email(email)
                .success(success)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        
        loginAttemptRepository.save(attempt);
    }
    
    // Result classes
    public static class AuthenticationResult {
        private final boolean success;
        private final String message;
        private final String accessToken;
        private final String refreshToken;
        private final User user;
        
        private AuthenticationResult(boolean success, String message, String accessToken, String refreshToken, User user) {
            this.success = success;
            this.message = message;
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.user = user;
        }
        
        public static AuthenticationResult success(String accessToken, String refreshToken, User user) {
            return new AuthenticationResult(true, "Authentication successful", accessToken, refreshToken, user);
        }
        
        public static AuthenticationResult failure(String message) {
            return new AuthenticationResult(false, message, null, null, null);
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getAccessToken() { return accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public User getUser() { return user; }
    }
    
    public static class RefreshTokenResult {
        private final boolean success;
        private final String message;
        private final String accessToken;
        
        private RefreshTokenResult(boolean success, String message, String accessToken) {
            this.success = success;
            this.message = message;
            this.accessToken = accessToken;
        }
        
        public static RefreshTokenResult success(String accessToken) {
            return new RefreshTokenResult(true, "Token refreshed successfully", accessToken);
        }
        
        public static RefreshTokenResult failure(String message) {
            return new RefreshTokenResult(false, message, null);
        }
        
        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getAccessToken() { return accessToken; }
    }
}
