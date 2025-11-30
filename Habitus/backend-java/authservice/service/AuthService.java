package com.habitus.authservice.service;

import com.habitus.authservice.dto.LoginRequest;
import com.habitus.authservice.dto.LoginResponse;
import com.habitus.authservice.dto.RegisterRequest;

public interface AuthService {
    void register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
}

