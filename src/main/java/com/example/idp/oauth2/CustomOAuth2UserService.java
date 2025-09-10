package com.example.idp.oauth2;

import com.example.idp.entity.User;
import com.example.idp.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;
    
    public CustomOAuth2UserService(@Lazy UserService userService) {
        this.userService = userService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        
        try {
            String provider = oAuth2UserRequest.getClientRegistration().getRegistrationId();
            Map<String, Object> attributes = oAuth2User.getAttributes();
            
            log.debug("OAuth2 provider: {}", provider);
            log.debug("OAuth2 attributes: {}", attributes);
            
            if ("google".equals(provider)) {
                return processGoogleUser(attributes, oAuth2User);
            }
            
            // For other providers, return the original user
            return oAuth2User;
            
        } catch (Exception ex) {
            log.error("Error processing OAuth2 user registration", ex);
            throw new OAuth2AuthenticationException("OAuth2 processing failed: " + ex.getMessage());
        }
    }
    
    private OAuth2User processGoogleUser(Map<String, Object> attributes, OAuth2User oAuth2User) {
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String googleId = (String) attributes.get("sub");
        String picture = (String) attributes.get("picture");
        
        log.debug("Processing Google user - Email: {}, Name: {}, ID: {}", email, name, googleId);
        
        // Create or update user in database
        User user = userService.registerGoogleOAuthUser(email, name, googleId, picture);
        
        // Update last login
        userService.updateLastLogin(user.getId());
        
        // Return a custom OAuth2User that includes our database user
        return new CustomOAuth2User(oAuth2User, user);
    }
}
