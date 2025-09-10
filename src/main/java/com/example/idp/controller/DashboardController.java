package com.example.idp.controller;

import com.example.idp.entity.User;
import com.example.idp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
@Slf4j
public class DashboardController {
    
    private final UserService userService;
    
    @GetMapping("/email-verification-success")
    public String emailVerificationSuccess(@RequestParam(required = false) String token, Model model) {
        log.info("Email verification success page accessed");
        
        // Add any additional data to the model if needed
        model.addAttribute("redirectUrl", "/dashboard");
        
        return "email-verification-success";
    }
    
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getName().equals("anonymousUser")) {
                
                String email = authentication.getName();
                User user = userService.findByEmail(email).orElse(null);
                
                if (user != null) {
                    model.addAttribute("user", user);
                    model.addAttribute("userName", user.getFullName());
                    model.addAttribute("userEmail", user.getEmail());
                    model.addAttribute("userId", user.getId());
                    model.addAttribute("profilePicture", user.getProfilePictureUrl());
                    model.addAttribute("emailVerified", user.getEmailVerified());
                    
                    log.info("Dashboard accessed by user: {}", user.getEmail());
                    return "dashboard";
                }
            }
            
            // If no authenticated user, redirect to login
            log.warn("Unauthenticated access to dashboard, redirecting to login");
            return "redirect:/login";
            
        } catch (Exception e) {
            log.error("Error accessing dashboard", e);
            return "redirect:/login";
        }
    }
    
    @GetMapping("/login")
    public String login() {
        return "redirect:/idp-widget/index.html";
    }
}
