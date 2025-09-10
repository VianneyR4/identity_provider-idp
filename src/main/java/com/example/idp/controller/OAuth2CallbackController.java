package com.example.idp.controller;

import com.example.idp.dto.ApiResponse;
import com.example.idp.oauth2.CustomOAuth2User;
import com.example.idp.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/oauth2")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class OAuth2CallbackController {

    private final JwtService jwtService;

    @GetMapping("/success")
    public ResponseEntity<ApiResponse<Map<String, Object>>> oauth2Success(
            @AuthenticationPrincipal CustomOAuth2User oauth2User,
            @RequestParam(required = false) Long userId) {
        
        try {
            if (oauth2User == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("No authenticated user found"));
            }

            // Generate JWT token for the authenticated user
            String jwtToken = jwtService.generateAccessToken(oauth2User.getUser(), "demo-app");

            Map<String, Object> response = Map.of(
                "token", jwtToken,
                "user", Map.of(
                    "id", oauth2User.getUserId().toString(),
                    "email", oauth2User.getEmail(),
                    "name", oauth2User.getName(),
                    "picture", oauth2User.getUser().getProfilePictureUrl()
                )
            );

            return ResponseEntity.ok(ApiResponse.success("OAuth2 authentication successful", response));

        } catch (Exception e) {
            log.error("OAuth2 success handler failed", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("OAuth2 authentication processing failed"));
        }
    }

    @GetMapping("/error")
    public ResponseEntity<ApiResponse<String>> oauth2Error(@RequestParam String error) {
        log.error("OAuth2 authentication failed: {}", error);
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("OAuth2 authentication failed: " + error));
    }
}
