package com.example.idp.service;

import com.example.idp.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;
    
    public void sendVerificationEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Verify Your Email Address");
            
            String verificationUrl = baseUrl + "/api/auth/verify-email?token=" + user.getEmailVerificationToken();
            
            String text = String.format(
                "Hello %s,\n\n" +
                "Thank you for registering with our Identity Provider service.\n\n" +
                "Please click the link below to verify your email address:\n" +
                "%s\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you didn't create this account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Identity Provider Team",
                user.getFullName(),
                verificationUrl
            );
            
            message.setText(text);
            mailSender.send(message);
            
            log.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", user.getEmail(), e);
        }
    }
    
    public void sendPasswordResetEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Reset Your Password");
            
            String resetUrl = baseUrl + "/reset-password?token=" + user.getPasswordResetToken();
            
            String text = String.format(
                "Hello %s,\n\n" +
                "We received a request to reset your password.\n\n" +
                "Please click the link below to reset your password:\n" +
                "%s\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you didn't request this password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Identity Provider Team",
                user.getFullName(),
                resetUrl
            );
            
            message.setText(text);
            mailSender.send(message);
            
            log.info("Password reset email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", user.getEmail(), e);
        }
    }
    
    public void sendWelcomeEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Welcome to Identity Provider");
            
            String text = String.format(
                "Hello %s,\n\n" +
                "Welcome to our Identity Provider service!\n\n" +
                "Your email has been successfully verified and your account is now active.\n\n" +
                "You can now use this account to sign in to any application that uses our identity service.\n\n" +
                "Best regards,\n" +
                "Identity Provider Team",
                user.getFullName()
            );
            
            message.setText(text);
            mailSender.send(message);
            
            log.info("Welcome email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", user.getEmail(), e);
        }
    }
}
