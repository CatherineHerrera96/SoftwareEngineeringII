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

}
