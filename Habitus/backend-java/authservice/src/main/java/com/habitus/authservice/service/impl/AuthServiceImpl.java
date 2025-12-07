package com.habitus.authservice.service.impl;

import com.habitus.authservice.dto.AuthResponse;
import com.habitus.authservice.dto.LoginRequest;
import com.habitus.authservice.dto.RegisterRequest;
import com.habitus.authservice.dto.UserResponse;
import com.habitus.authservice.entity.User;
import com.habitus.authservice.exception.EmailAlreadyExistsException;
import com.habitus.authservice.exception.InvalidCredentialsException;
import com.habitus.authservice.exception.UserNotFoundException;
import com.habitus.authservice.repository.UserRepository;
import com.habitus.authservice.repository.PasswordResetTokenRepository;
import com.habitus.authservice.security.jwt.JwtService;
import com.habitus.authservice.service.AuthService;
import com.habitus.authservice.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:8001}")
    private String frontendUrl;

    public AuthServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
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
        log.info("Password reset requested for email: {}", email);

        try {
            // Find user (but don't reveal if they exist for security)
            var userOptional = userRepository.findByEmail(email.toLowerCase());

            if (userOptional.isEmpty()) {
                // Silently return without error (security best practice)
                log.info("Password reset requested for non-existent email: {}", email);
                return;
            }

            User user = userOptional.get();
            log.info("User found for password reset: {}", user.getEmail());

            // 1. Generate Raw Token
            String rawToken = UUID.randomUUID().toString();
            log.debug("Generated reset token UUID: {}", rawToken);

            // 2. Build Link BEFORE hashing for dev logging
            String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
            log.warn("=== DEV ONLY === Password reset link for {}: {}", user.getEmail(), resetLink);

            // 3. Hash Token (SHA-256) for storage
            String tokenHash = hashToken(rawToken);
            log.debug("Token hashed successfully");

            // 4. Save to DB
            com.habitus.authservice.entity.PasswordResetToken resetToken = com.habitus.authservice.entity.PasswordResetToken
                    .builder()
                    .tokenHash(tokenHash)
                    .user(user)
                    .expiryDate(LocalDateTime.now().plusHours(1))
                    .build();

            tokenRepository.save(resetToken);
            log.info("Saved password reset token to database for user: {}", user.getEmail());

            // 5. Send Email with styled HTML
            String emailBody = buildStyledEmailHtml(user.getEmail(), resetLink);

            try {
                log.info("Attempting to send password reset email to: {}", user.getEmail());
                emailService.sendSimpleMessage(user.getEmail(), "Habitus – Reset Your Password", emailBody);
                log.info("✓ Password reset email sent successfully to: {}", user.getEmail());
            } catch (Exception emailEx) {
                // Log full exception details but don't throw - we don't want to reveal email
                // existence through errors
                log.error("✗ FAILED to send password reset email to {}", user.getEmail());
                log.error("Email error type: {}", emailEx.getClass().getName());
                log.error("Email error message: {}", emailEx.getMessage());
                log.error("Full stack trace:", emailEx);
            }
        } catch (Exception e) {
            // Log the error but don't throw - for security, always appear to succeed
            log.error("Unexpected error in sendPasswordResetEmail for {}: {}", email, e.getMessage(), e);
        }
    }

    @Override
    public void resetPassword(String rawToken, String newPassword) {
        // 1. Hash incoming token
        String tokenHash = hashToken(rawToken);

        // 2. Find in DB
        var tokenOpt = tokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        var resetToken = tokenOpt.get();

        // 3. Check Expiry
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken); // Cleanup
            throw new IllegalArgumentException("Invalid or expired token");
        }

        // 4. Update Password
        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 5. Delete Token (One-time use)
        tokenRepository.delete(resetToken);

        log.info("Password reset successfully for user: {}", user.getEmail());
    }

    @Override
    public void changePassword(Integer userId, String currentPassword, String newPassword) {
        // 1. Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. Validate current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // 3. Validate new password is different
        if (currentPassword.equals(newPassword)) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        // 4. Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", user.getEmail());
    }

    @Override
    public UserResponse changeEmail(Integer userId, String currentPassword, String newEmail) {
        // 1. Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. Validate current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // 3. Check if new email is already in use
        if (userRepository.findByEmail(newEmail).isPresent()) {
            throw new IllegalArgumentException("Email is already in use");
        }

        // 4. Update email
        String oldEmail = user.getEmail();
        user.setEmail(newEmail);
        userRepository.save(user);

        log.info("Email changed from {} to {} for user ID: {}", oldEmail, newEmail, userId);

        // 5. Return updated user info
        return new com.habitus.authservice.dto.UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getTimezone());
    }

    @Override
    public void deleteAccount(Integer userId, String currentPassword) {
        // 1. Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. Validate current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // 3. Delete user (cascade will handle related entities if configured)
        userRepository.delete(user);

        log.info("Account deleted for user: {} (ID: {})", user.getEmail(), userId);
    }

    private String buildStyledEmailHtml(String email, String resetLink) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "</head>" +
                "<body style=\"margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f5f5f5;\">"
                +
                "  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f5f5f5; padding: 40px 20px;\">"
                +
                "    <tr>" +
                "      <td align=\"center\">" +
                "        <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);\">"
                +
                "          <!-- Header -->" +
                "          <tr>" +
                "            <td style=\"background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center;\">"
                +
                "              <h1 style=\"margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;\">Habitus</h1>"
                +
                "              <p style=\"margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;\">Password Reset Request</p>"
                +
                "            </td>" +
                "          </tr>" +
                "          <!-- Content -->" +
                "          <tr>" +
                "            <td style=\"padding: 40px;\">" +
                "              <p style=\"margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;\">Hello,</p>"
                +
                "              <p style=\"margin: 0 0 20px 0; color: #555555; font-size: 14px; line-height: 1.6;\">We received a request to reset the password for your Habitus account (<strong>"
                + email + "</strong>).</p>" +
                "              <p style=\"margin: 0 0 30px 0; color: #555555; font-size: 14px; line-height: 1.6;\">Click the button below to set a new password:</p>"
                +
                "              <!-- Button -->" +
                "              <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">" +
                "                <tr>" +
                "                  <td align=\"center\" style=\"padding: 20px 0;\">" +
                "                    <a href=\"" + resetLink
                + "\" style=\"display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);\">Reset Password</a>"
                +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "              <p style=\"margin: 20px 0 10px 0; color: #888888; font-size: 13px; line-height: 1.6;\">Or copy and paste this link into your browser:</p>"
                +
                "              <p style=\"margin: 0 0 30px 0; padding: 12px; background-color: #f8f9fa; border-radius: 6px; word-break: break-all;\"><a href=\""
                + resetLink + "\" style=\"color: #3b82f6; text-decoration: none; font-size: 13px;\">" + resetLink
                + "</a></p>" +
                "              <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #fff9e6; border-left: 4px solid #ffc107; padding: 16px; border-radius: 6px; margin-top: 30px;\">"
                +
                "                <tr>" +
                "                  <td>" +
                "                    <p style=\"margin: 0 0 8px 0; color: #856404; font-size: 13px; font-weight: 600;\">⚠️ Important:</p>"
                +
                "                    <p style=\"margin: 0; color: #856404; font-size: 13px; line-height: 1.5;\">This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>"
                +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "            </td>" +
                "          </tr>" +
                "          <!-- Footer -->" +
                "          <tr>" +
                "            <td style=\"background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;\">"
                +
                "              <p style=\"margin: 0 0 8px 0; color: #666666; font-size: 14px; font-weight: 600;\">Habitus</p>"
                +
                "              <p style=\"margin: 0; color: #999999; font-size: 12px;\">Build better habits, one day at a time.</p>"
                +
                "            </td>" +
                "          </tr>" +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>";
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    private static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (int i = 0; i < hash.length; i++) {
            String hex = Integer.toHexString(0xff & hash[i]);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
