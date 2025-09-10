package com.example.idp.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class AuthResponse {
    
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private UserInfo user;
    
    @Data
    @Builder
    public static class UserInfo {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        private String fullName;
        private boolean emailVerified;
        private String profilePictureUrl;
    }
}
