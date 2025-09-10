package com.example.idp.controller;

import com.example.idp.dto.ApiResponse;
import com.example.idp.dto.AuthResponse;
import com.example.idp.entity.User;
import com.example.idp.service.AuthenticationService;
import com.example.idp.service.JwtService;
import com.example.idp.service.UserService;
import com.example.idp.util.HttpUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/oauth2")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class OAuth2Controller {
    
    private final UserService userService;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;
    
    @Value("${oauth2.linkedin.client-id}")
    private String linkedinClientId;
    
    @Value("${oauth2.linkedin.client-secret}")
    private String linkedinClientSecret;
    
    @Value("${oauth2.linkedin.redirect-uri}")
    private String linkedinRedirectUri;
    
    @Value("${oauth2.google.client-id}")
    private String googleClientId;
    
    @Value("${oauth2.google.client-secret}")
    private String googleClientSecret;
    
    @Value("${oauth2.google.redirect-uri}")
    private String googleRedirectUri;
    
    @GetMapping("/linkedin/callback")
    public ResponseEntity<String> linkedinCallbackGet(
            @RequestParam String code,
            @RequestParam String state,
            HttpServletRequest httpRequest) {
        
        // Return HTML page that will communicate with the widget
        String html = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>LinkedIn Authentication</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
                    @keyframes spin { 0%% { transform: rotate(0deg); } 100%% { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <h2>Processing LinkedIn Authentication...</h2>
                <div class="spinner"></div>
                <p>Please wait while we complete your authentication.</p>
                
                <script>
                    // Try to communicate with parent window (if in popup)
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'linkedin_callback',
                            code: '%s',
                            state: '%s'
                        }, '*');
                        window.close();
                    } else {
                        // If not in popup, redirect to close page or show success
                        setTimeout(function() {
                            document.body.innerHTML = '<h2>Authentication Complete</h2><p>You can close this window and return to the application.</p>';
                        }, 2000);
                    }
                </script>
            </body>
            </html>
            """, code, state);
        
        return ResponseEntity.ok()
            .header("Content-Type", "text/html")
            .body(html);
    }
    
    @PostMapping("/linkedin/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> linkedinCallback(
            @RequestParam String code,
            @RequestParam String state,
            @RequestParam(required = false) String clientId,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("LinkedIn OAuth callback received - clientId: {}, state: {}", clientId, state);
            
            // Use state as clientId if clientId is not provided
            String effectiveClientId = (clientId != null) ? clientId : state;
            
            // Exchange authorization code for access token
            log.info("Exchanging LinkedIn code for access token");
            String accessToken = exchangeLinkedInCodeForToken(code, effectiveClientId);
            
            // Get user info from LinkedIn
            log.info("Fetching LinkedIn user info");
            LinkedInUserInfo userInfo = getLinkedInUserInfo(accessToken);
            
            if (userInfo == null || userInfo.getEmail() == null) {
                log.error("Invalid LinkedIn user info received");
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid user information received from LinkedIn"));
            }
            
            log.info("Registering LinkedIn OAuth user: {}", userInfo.getEmail());
            
            // Register/update user using the new LinkedIn-specific method
            User user = userService.registerLinkedInOAuthUser(
                userInfo.getEmail(),
                userInfo.getGivenName(),
                userInfo.getFamilyName(),
                userInfo.getSub(),
                userInfo.getPicture()
            );
            
            // Generate JWT token
            log.info("Generating JWT token for LinkedIn user: {}", user.getId());
            String jwtToken = jwtService.generateAccessToken(user, effectiveClientId);
            
            // Build response
            Map<String, Object> responseData = Map.of(
                "accessToken", jwtToken,
                "refreshToken", jwtToken, // For now, using same token for both
                "user", Map.of(
                    "id", user.getId().toString(),
                    "email", user.getEmail(),
                    "name", user.getFullName(),
                    "picture", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : ""
                )
            );
            
            log.info("LinkedIn OAuth callback completed successfully for user: {}", user.getId());
            log.info("LinkedIn OAuth callback completed responseData: {}", responseData);
            return ResponseEntity.ok(ApiResponse.success("LinkedIn OAuth successful", responseData));
            
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation in LinkedIn OAuth callback", e);
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("User registration conflict: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Runtime error in LinkedIn OAuth callback", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("LinkedIn OAuth failed: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error in LinkedIn OAuth callback", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("OAuth authentication failed: " + e.getMessage()));
        }
    }
    
    @GetMapping("/linkedin/authorize")
    public ResponseEntity<ApiResponse<String>> getLinkedInAuthUrl(
            @RequestParam String clientId,
            @RequestParam(required = false) String state) {
        
        try {
            String authUrl = String.format(
                "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=%s&redirect_uri=%s&scope=openid%%20profile%%20email&state=%s",
                linkedinClientId,
                linkedinRedirectUri,
                state != null ? state : clientId
            );
            
            return ResponseEntity.ok(ApiResponse.success("Authorization URL generated", authUrl));
            
        } catch (Exception e) {
            log.error("Failed to generate LinkedIn auth URL", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to generate authorization URL"));
        }
    }
    
    private String exchangeLinkedInCodeForToken(String code, String clientId) {
        try {
            log.info("Exchanging LinkedIn code for access token, clientId: {}", clientId);
            
            // Get client credentials based on clientId
            String linkedinClientId = getLinkedInClientId(clientId);
            String linkedinClientSecret = getLinkedInClientSecret(clientId);
            String redirectUri = getLinkedInRedirectUri(clientId);
            
            log.info("Using LinkedIn clientId: {}, redirectUri: {}", linkedinClientId, redirectUri);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
            requestBody.add("grant_type", "authorization_code");
            requestBody.add("code", code);
            requestBody.add("redirect_uri", redirectUri);
            requestBody.add("client_id", linkedinClientId);
            requestBody.add("client_secret", linkedinClientSecret);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(requestBody, headers);
            
            log.info("Sending token request to LinkedIn...");
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://www.linkedin.com/oauth/v2/accessToken", 
                request, 
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String accessToken = (String) response.getBody().get("access_token");
                log.info("Successfully obtained LinkedIn access token");
                return accessToken;
            } else {
                log.error("LinkedIn token exchange failed: {} - {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to exchange LinkedIn code for token: " + response.getStatusCode());
            }
            
        } catch (HttpClientErrorException e) {
            log.error("LinkedIn token exchange HTTP error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("LinkedIn authentication failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("LinkedIn token exchange failed", e);
            throw new RuntimeException("LinkedIn authentication failed: " + e.getMessage());
        }
    }
    
    private String getLinkedInClientId(String clientId) {
        // Map your internal clientId to LinkedIn clientId
        if ("demo-app".equals(clientId) || "my-application-9f03ce9f".equals(clientId)) {
            return linkedinClientId; // Use the configured LinkedIn client ID
        }
        throw new RuntimeException("Unknown client ID: " + clientId);
    }

    private String getLinkedInClientSecret(String clientId) {
        // Map your internal clientId to LinkedIn clientSecret
        if ("demo-app".equals(clientId) || "my-application-9f03ce9f".equals(clientId)) {
            return linkedinClientSecret; // Use the configured LinkedIn client secret
        }
        throw new RuntimeException("Unknown client ID: " + clientId);
    }

    private String getLinkedInRedirectUri(String clientId) {
        // Map your internal clientId to redirect URI
        if ("demo-app".equals(clientId) || "my-application-9f03ce9f".equals(clientId)) {
            return linkedinRedirectUri; // Use the configured redirect URI
        }
        throw new RuntimeException("Unknown client ID: " + clientId);
    }
    
    private LinkedInUserInfo getLinkedInUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<LinkedInUserInfo> response = restTemplate.exchange(
                "https://api.linkedin.com/v2/userinfo",
                HttpMethod.GET,
                entity,
                LinkedInUserInfo.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to get user info from LinkedIn: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to get LinkedIn user info", e);
            throw new RuntimeException("Failed to retrieve user information from LinkedIn");
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
    
    // Google OAuth endpoints
    @GetMapping("/google/callback")
    public ResponseEntity<String> googleCallbackGet(
            @RequestParam String code,
            @RequestParam String state,
            HttpServletRequest httpRequest) {
        
        // Return HTML page that will communicate with the widget
        String html = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Google Authentication</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #4285f4; border-radius: 50%%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
                    @keyframes spin { 0%% { transform: rotate(0deg); } 100%% { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <h2>Processing Google Authentication...</h2>
                <div class="spinner"></div>
                <p>Please wait while we complete your authentication.</p>
                
                <script>
                    // Try to communicate with parent window (if in popup)
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'GOOGLE_OAUTH_CALLBACK',
                            code: '%s',
                            state: '%s'
                        }, '*');
                        window.close();
                    } else {
                        // If not in popup, redirect to close page or show success
                        setTimeout(function() {
                            document.body.innerHTML = '<h2>Authentication Complete</h2><p>You can close this window and return to the application.</p>';
                        }, 2000);
                    }
                </script>
            </body>
            </html>
            """, code, state);
        
        return ResponseEntity.ok()
            .header("Content-Type", "text/html")
            .body(html);
    }
    
    @PostMapping("/google/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> googleCallback(
            @RequestParam String code,
            @RequestParam String state,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("Google OAuth callback received - code: {}, state: {}", code, state);
            
            // Exchange code for access token
            String accessToken = exchangeGoogleCodeForToken(code);
            log.info("Successfully obtained access token");
            
            // Get user info from Google
            GoogleUserInfo userInfo = getGoogleUserInfo(accessToken);
            log.info("Retrieved user info from Google: {}", userInfo.getEmail());
            
            // Create or update user
            User user = userService.registerGoogleOAuthUser(
                userInfo.getEmail(),
                userInfo.getName(),
                userInfo.getId(),
                userInfo.getPicture()
            );
            log.info("User processed successfully: {}", user.getId());
            
            // Generate JWT token
            String jwtToken = jwtService.generateAccessToken(user, "demo-app");
            
            Map<String, Object> response = Map.of(
                "accessToken", jwtToken,
                "refreshToken", jwtToken, // For now, using same token for both
                "user", Map.of(
                    "id", user.getId().toString(),
                    "email", user.getEmail(),
                    "name", user.getFullName(),
                    "picture", user.getProfilePictureUrl()
                )
            );
            
            return ResponseEntity.ok(ApiResponse.success("Google OAuth successful", response));
            
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("Database constraint violation in Google OAuth", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("User registration failed - email may already exist"));
        } catch (RuntimeException e) {
            log.error("Google OAuth registration failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error in Google OAuth callback", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Google OAuth authentication failed"));
        }
    }
    
    @GetMapping("/google/auth")
    public ResponseEntity<ApiResponse<String>> getGoogleAuthUrl() {
        try {
            String state = java.util.UUID.randomUUID().toString();
            
            String authUrl = String.format(
                "https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&scope=%s&response_type=code&state=%s",
                googleClientId,
                java.net.URLEncoder.encode(googleRedirectUri, "UTF-8"),
                java.net.URLEncoder.encode("openid email profile", "UTF-8"),
                state
            );
            
            return ResponseEntity.ok(ApiResponse.success("Authorization URL generated", authUrl));
            
        } catch (Exception e) {
            log.error("Failed to generate Google auth URL", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Failed to generate authorization URL"));
        }
    }
    
    private String exchangeGoogleCodeForToken(String code) {
        String tokenUrl = "https://oauth2.googleapis.com/token";
        
        try {
            // URL decode the authorization code
            String decodedCode = java.net.URLDecoder.decode(code, "UTF-8");
            
            String requestBody = String.format(
                "grant_type=authorization_code&code=%s&client_id=%s&client_secret=%s&redirect_uri=%s",
                java.net.URLEncoder.encode(decodedCode, "UTF-8"), 
                java.net.URLEncoder.encode(googleClientId, "UTF-8"), 
                java.net.URLEncoder.encode(googleClientSecret, "UTF-8"), 
                java.net.URLEncoder.encode(googleRedirectUri, "UTF-8")
            );
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
            
            org.springframework.http.HttpEntity<String> entity = 
                new org.springframework.http.HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                tokenUrl,
                entity,
                Map.class
            );
            
            Map<String, Object> responseBody = response.getBody();
            return (String) responseBody.get("access_token");
            
        } catch (Exception e) {
            log.error("Failed to exchange Google code for token", e);
            throw new RuntimeException("Failed to get Google access token", e);
        }
    }
    
    private GoogleUserInfo getGoogleUserInfo(String accessToken) {
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
        
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            org.springframework.http.HttpEntity<String> entity = 
                new org.springframework.http.HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                userInfoUrl,
                org.springframework.http.HttpMethod.GET,
                entity,
                Map.class
            );
            
            Map<String, Object> userInfoMap = response.getBody();
            
            return GoogleUserInfo.builder()
                .id((String) userInfoMap.get("id"))
                .email((String) userInfoMap.get("email"))
                .name((String) userInfoMap.get("name"))
                .picture((String) userInfoMap.get("picture"))
                .build();
                
        } catch (Exception e) {
            log.error("Failed to get Google user info", e);
            throw new RuntimeException("Failed to get Google user info", e);
        }
    }

    @lombok.Data
    public static class LinkedInUserInfo {
        private String sub;
        private String email;
        private String email_verified;
        private String given_name;
        private String family_name;
        private String picture;
        
        public String getEmail() {
            return email;
        }
        
        public String getGivenName() {
            return given_name;
        }
        
        public String getFamilyName() {
            return family_name;
        }
        
        public String getPicture() {
            return picture;
        }
        
        public String getSub() {
            return sub;
        }
        
        public boolean isEmailVerified() {
            return "true".equals(email_verified);
        }
    }
    
    @lombok.Data
    @lombok.Builder
    private static class GoogleUserInfo {
        private String id;
        private String email;
        private String name;
        private String picture;
    }
}
