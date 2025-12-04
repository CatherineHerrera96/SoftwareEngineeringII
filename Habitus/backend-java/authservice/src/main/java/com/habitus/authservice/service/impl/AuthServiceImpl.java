package com.habitus.authservice.service.impl;

import com.habitus.authservice.dto.AuthResponse;
import com.habitus.authservice.dto.LoginRequest;
import com.habitus.authservice.dto.RegisterRequest;
import com.habitus.authservice.entity.User;
import com.habitus.authservice.exception.EmailAlreadyExistsException;
import com.habitus.authservice.exception.InvalidCredentialsException;
import com.habitus.authservice.exception.UserNotFoundException;
import com.habitus.authservice.repository.UserRepository;
import com.habitus.authservice.security.jwt.JwtService;
import com.habitus.authservice.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:8001}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@habitus.com}")
    private String fromEmail;

    public AuthServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailSender = mailSender;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail().toLowerCase()).isPresent()) {
            throw new EmailAlreadyExistsException("Email is already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Incorrect password");
        }

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token);
    }

    @Override
    public void sendPasswordResetEmail(String email) {
        // Find user (but don't reveal if they exist for security)
        var userOptional = userRepository.findByEmail(email.toLowerCase());

        if (userOptional.isEmpty()) {
            // Silently return without error (security best practice)
            log.info("Password reset requested for non-existent email: {}", email);
            return;
        }

        User user = userOptional.get();

        // Generate a reset token (JWT with short expiry)
        String resetToken = jwtService.generatePasswordResetToken(user.getEmail());

        // Build reset link
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        // Send email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Habitus - Password Reset Request");
            message.setText(
                    "Hello,\n\n" +
                            "You requested to reset your password for Habitus.\n\n" +
                            "Click the link below to reset your password:\n" +
                            resetLink + "\n\n" +
                            "This link will expire in 1 hour.\n\n" +
                            "If you didn't request this, please ignore this email.\n\n" +
                            "Thanks,\nThe Habitus Team");

            mailSender.send(message);
            log.info("Password reset email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
            // Don't throw - we don't want to reveal email existence
        }
    }
}
