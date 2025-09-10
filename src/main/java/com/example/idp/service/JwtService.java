package com.example.idp.service;

import com.example.idp.entity.User;
import com.example.idp.entity.UserRole;
import com.example.idp.repository.UserRoleRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.KeyPair;
import java.security.PublicKey;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class JwtService {
    
    @Value("${jwt.access-token.expiration:900}") // 15 minutes default
    private long accessTokenExpiration;
    
    @Value("${jwt.refresh-token.expiration:604800}") // 7 days default
    private long refreshTokenExpiration;
    
    @Value("${jwt.issuer:idp-service}")
    private String issuer;
    
    private final UserRoleRepository userRoleRepository;
    private KeyPair keyPair;
    private String keyId = "idp-key-1";
    
    public JwtService(UserRoleRepository userRoleRepository) {
        this.userRoleRepository = userRoleRepository;
    }
    
    @PostConstruct
    public void init() {
        // Generate RSA key pair for JWT signing
        this.keyPair = Keys.keyPairFor(SignatureAlgorithm.RS256);
        log.info("JWT RSA key pair generated successfully");
    }
    
    public String generateAccessToken(User user, String clientId) {
        try {
            Map<String, Object> claims = new HashMap<>();
            claims.put("sub", user.getId().toString());
            claims.put("email", user.getEmail());
            claims.put("name", user.getFullName());
            claims.put("email_verified", user.getEmailVerified());
            claims.put("client_id", clientId);
            
            // Extract roles safely without accessing the Hibernate collection
            List<String> roles = getRolesForUserSafely(user);
            claims.put("roles", roles);
            
            return createToken(claims, accessTokenExpiration, "access");
            
        } catch (Exception e) {
            log.error("Failed to generate JWT token for user: {}", user.getId(), e);
            throw new RuntimeException("Failed to generate access token");
        }
    }
    
    // Add this helper method
    private List<String> getRolesForUserSafely(User user) {
        try {
            // Option 1: Use a direct database query (recommended)
            if (userRoleRepository != null) {
                return userRoleRepository.findRoleNamesByUserId(user.getId());
            }
            
            // Option 2: Use a safe copy approach
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                return user.getRoles().stream()
                    .map(UserRole::getRole)
                    .collect(Collectors.toList());
            }
            
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to get roles for user: {}, using empty list", user.getId(), e);
            return Collections.emptyList();
        }
    }
    
    public String generateRefreshToken(User user, String clientId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", user.getId().toString());
        claims.put("client_id", clientId);
        
        return createToken(claims, refreshTokenExpiration, "refresh");
    }
    
    private String createToken(Map<String, Object> claims, long expiration, String tokenType) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration * 1000);
        
        return Jwts.builder()
                .setHeaderParam("kid", keyId)
                .setHeaderParam("typ", "JWT")
                .setClaims(claims)
                .setIssuer(issuer)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .claim("token_type", tokenType)
                .signWith(keyPair.getPrivate(), SignatureAlgorithm.RS256)
                .compact();
    }
    
    public Claims validateToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(keyPair.getPublic())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
            throw new RuntimeException("Token expired", e);
        } catch (UnsupportedJwtException e) {
            log.warn("JWT token is unsupported: {}", e.getMessage());
            throw new RuntimeException("Token unsupported", e);
        } catch (MalformedJwtException e) {
            log.warn("JWT token is malformed: {}", e.getMessage());
            throw new RuntimeException("Token malformed", e);
        } catch (SecurityException e) {
            log.warn("JWT signature validation failed: {}", e.getMessage());
            throw new RuntimeException("Token signature invalid", e);
        } catch (IllegalArgumentException e) {
            log.warn("JWT token compact of handler are invalid: {}", e.getMessage());
            throw new RuntimeException("Token invalid", e);
        }
    }
    
    public Long getUserIdFromToken(String token) {
        Claims claims = validateToken(token);
        return Long.parseLong(claims.getSubject());
    }
    
    public String getClientIdFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("client_id", String.class);
    }
    
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = validateToken(token);
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
    
    public boolean isAccessToken(String token) {
        try {
            Claims claims = validateToken(token);
            return "access".equals(claims.get("token_type", String.class));
        } catch (Exception e) {
            return false;
        }
    }
    
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = validateToken(token);
            return "refresh".equals(claims.get("token_type", String.class));
        } catch (Exception e) {
            return false;
        }
    }
    
    public PublicKey getPublicKey() {
        return keyPair.getPublic();
    }
    
    public String getKeyId() {
        return keyId;
    }
    
    public Map<String, Object> getJwksResponse() {
        PublicKey publicKey = keyPair.getPublic();
        
        // Convert RSA public key to JWK format
        java.security.interfaces.RSAPublicKey rsaPublicKey = 
            (java.security.interfaces.RSAPublicKey) publicKey;
        
        Map<String, Object> jwk = new HashMap<>();
        jwk.put("kty", "RSA");
        jwk.put("use", "sig");
        jwk.put("kid", keyId);
        jwk.put("alg", "RS256");
        
        // Convert to Base64 URL encoding
        byte[] nBytes = rsaPublicKey.getModulus().toByteArray();
        byte[] eBytes = rsaPublicKey.getPublicExponent().toByteArray();
        
        // Remove leading zero byte if present
        if (nBytes[0] == 0) {
            byte[] tmp = new byte[nBytes.length - 1];
            System.arraycopy(nBytes, 1, tmp, 0, tmp.length);
            nBytes = tmp;
        }
        
        jwk.put("n", java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(nBytes));
        jwk.put("e", java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(eBytes));
        
        Map<String, Object> jwks = new HashMap<>();
        jwks.put("keys", List.of(jwk));
        
        return jwks;
    }
}
