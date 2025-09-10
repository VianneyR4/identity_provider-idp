package com.example.idp.controller;

import com.example.idp.dto.*;
import com.example.idp.entity.User;
import com.example.idp.service.AuthenticationService;
import com.example.idp.service.UserService;
import com.example.idp.util.HttpUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {
    
    private final AuthenticationService authenticationService;
    private final UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            String ipAddress = HttpUtils.getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            // Register user
            User user = userService.registerUser(
                request.getEmail(),
                request.getPassword(),
                request.getFirstName(),
                request.getLastName(),
                request.getRole()
            );
            
            // For registration, we don't immediately authenticate
            // User needs to verify email first
            return ResponseEntity.ok(ApiResponse.success(
                "Registration successful. Please check your email to verify your account.",
                null
            ));
            
        } catch (RuntimeException e) {
            log.error("Registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Registration failed", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during registration", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error"));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        try {
            String ipAddress = HttpUtils.getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            AuthenticationService.AuthenticationResult result = 
                authenticationService.authenticateUser(
                    request.getEmail(),
                    request.getPassword(),
                    request.getClientId(),
                    ipAddress,
                    userAgent
                );
            
            if (!result.isSuccess()) {

        
            log.error("============= exception login: {}", result.getMessage());
            log.error("============= exception response: {}", ResponseEntity.badRequest()
            .body(ApiResponse.error("Authentication failed", result.getMessage())));
        
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Authentication failed", result.getMessage()));
            }
            
            AuthResponse response = buildAuthResponse(result);
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            log.error("Unexpected error during login", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error"));
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        
        try {
            AuthenticationService.RefreshTokenResult result = 
                authenticationService.refreshAccessToken(
                    request.getRefreshToken(),
                    request.getClientId()
                );
            
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Token refresh failed", result.getMessage()));
            }
            
            AuthResponse response = AuthResponse.builder()
                .accessToken(result.getAccessToken())
                .tokenType("Bearer")
                .expiresIn(900L) // 15 minutes
                .build();
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            log.error("Unexpected error during token refresh", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error"));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            // Extract user ID from access token if present
            String authHeader = httpRequest.getHeader("Authorization");
            Long userId = null;
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                // This would require JWT validation - simplified for now
                // In production, you'd validate the JWT and extract user ID
            }
            
            if (request != null && request.getRefreshToken() != null) {
                authenticationService.logout(request.getRefreshToken(), userId);
            }
            
            return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
            
        } catch (Exception e) {
            log.error("Unexpected error during logout", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error"));
        }
    }
    
    @PostMapping("/password-reset")
    public ResponseEntity<ApiResponse<String>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request) {
        
        try {
            userService.initiatePasswordReset(request.getEmail());
            
            // Always return success to prevent email enumeration
            return ResponseEntity.ok(ApiResponse.success(
                "If an account with that email exists, a password reset link has been sent."
            ));
            
        } catch (Exception e) {
            log.error("Unexpected error during password reset request", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error"));
        }
    }
    
    @PostMapping("/password-reset/confirm")
    public ResponseEntity<ApiResponse<String>> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        
        try {
            boolean success = userService.resetPassword(request.getToken(), request.getNewPassword());
            
            if (!success) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid or expired reset token"));
            }
            
            return ResponseEntity.ok(ApiResponse.success("Password reset successfully"));
            
        } catch (Exception e) {
            log.error("Unexpected error during password reset confirmation", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error"));
        }
    }
    
    @GetMapping("/verify-email")
    public String verifyEmail(@RequestParam String token) {
        log.info("Email verification request received for token: {}", token);
        
        if (token == null || token.trim().isEmpty()) {
            log.warn("Email verification attempted with empty token");
            return "redirect:/login?error=invalid_token";
        }
        
        try {
            boolean success = userService.verifyEmail(token.trim());
            
            if (success) {
                log.info("Email verification successful for token: {}", token);
                return "redirect:/email-verification-success";
            } else {
                log.info("Email verification failed - invalid or expired token: {}", token);
                return "redirect:/login?error=verification_failed";
            }
            
        } catch (Exception e) {
            log.error("Error during email verification for token: {}", token, e);
            return "redirect:/login?error=server_error";
        }
    }
    
    private AuthResponse buildAuthResponse(AuthenticationService.AuthenticationResult result) {
        User user = result.getUser();
        
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .fullName(user.getFullName())
            .emailVerified(user.getEmailVerified())
            .profilePictureUrl(user.getProfilePictureUrl())
            .build();
        
        return AuthResponse.builder()
            .accessToken(result.getAccessToken())
            .refreshToken(result.getRefreshToken())
            .tokenType("Bearer")
            .expiresIn(900L) // 15 minutes
            .user(userInfo)
            .build();
    }
}
