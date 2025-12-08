package com.habitus.authservice.controller;

import com.habitus.authservice.dto.AuthResponse;
import com.habitus.authservice.dto.LoginRequest;
import com.habitus.authservice.dto.RegisterRequest;
import com.habitus.authservice.dto.ForgotPasswordRequest;
import com.habitus.authservice.entity.User;
import com.habitus.authservice.service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public User me() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var userDetails = (com.habitus.authservice.security.CustomUserDetails) auth.getPrincipal();
        return userDetails.getUser();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.sendPasswordResetEmail(request.getEmail());
        } catch (Exception e) {
            // Log but still return success for security (don't reveal errors)
            System.err.println("Error in forgot-password endpoint: " + e.getMessage());
            e.printStackTrace();
        }
        // Always return 200 for security (don't reveal if email exists or if there were
        // errors)
        return ResponseEntity.ok("If an account exists for this email, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody com.habitus.authservice.dto.ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok("Password has been reset successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody com.habitus.authservice.dto.ChangePasswordRequest request) {
        try {
            // Get authenticated user ID from security context
            var auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("Auth: " + auth);
            System.out.println("Principal: " + auth.getPrincipal());
            System.out.println("Principal class: " + auth.getPrincipal().getClass().getName());

            var userDetails = (com.habitus.authservice.security.CustomUserDetails) auth.getPrincipal();
            Integer userId = userDetails.getUser().getId();

            authService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok("Password changed successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (ClassCastException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Authentication error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/change-email")
    public ResponseEntity<?> changeEmail(@RequestBody com.habitus.authservice.dto.ChangeEmailRequest request) {
        try {
            // Get authenticated user ID from security context
            var auth = SecurityContextHolder.getContext().getAuthentication();
            var userDetails = (com.habitus.authservice.security.CustomUserDetails) auth.getPrincipal();
            Integer userId = userDetails.getUser().getId();

            com.habitus.authservice.dto.UserResponse updatedUser = authService.changeEmail(
                    userId,
                    request.getCurrentPassword(),
                    request.getNewEmail());
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            // Check if it's a duplicate email error
            if (e.getMessage().contains("already in use")) {
                return ResponseEntity.status(409).body(e.getMessage());
            }
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (ClassCastException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Authentication error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PatchMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.habitus.authservice.dto.UpdateProfileRequest request) {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            var userDetails = (com.habitus.authservice.security.CustomUserDetails) auth.getPrincipal();
            Integer userId = userDetails.getUser().getId();

            var updatedUser = authService.updateProfile(userId, request);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @DeleteMapping("/account")
    public ResponseEntity<String> deleteAccount(@RequestBody com.habitus.authservice.dto.DeleteAccountRequest request) {
        try {
            // Get authenticated user ID from security context
            var auth = SecurityContextHolder.getContext().getAuthentication();
            var userDetails = (com.habitus.authservice.security.CustomUserDetails) auth.getPrincipal();
            Integer userId = userDetails.getUser().getId();

            authService.deleteAccount(userId, request.getCurrentPassword());
            return ResponseEntity.ok("Account deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (ClassCastException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Authentication error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/test-email")
    public ResponseEntity<String> sendTestEmail(@RequestParam String email) {
        try {
            authService.sendTestEmail(email);
            return ResponseEntity.ok("Test email sent to " + email);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to send test email: " + e.getMessage());
        }
    }

}
