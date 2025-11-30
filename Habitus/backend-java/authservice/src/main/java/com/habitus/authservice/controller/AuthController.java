package com.habitus.authservice.controller;

import com.habitus.authservice.dto.AuthResponse;
import com.habitus.authservice.dto.LoginRequest;
import com.habitus.authservice.dto.RegisterRequest;
import com.habitus.authservice.entity.User;
import com.habitus.authservice.service.AuthService;

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

}

