package com.habitus.authservice.service;

import com.habitus.authservice.dto.AuthResponse;
import com.habitus.authservice.dto.LoginRequest;
import com.habitus.authservice.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void sendPasswordResetEmail(String email);
}
