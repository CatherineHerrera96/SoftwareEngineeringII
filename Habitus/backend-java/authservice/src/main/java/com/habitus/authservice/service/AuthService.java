package com.habitus.authservice.service;

import com.habitus.authservice.dto.*;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void sendPasswordResetEmail(String email);

    void resetPassword(String token, String newPassword);

    void changePassword(Integer userId, String currentPassword, String newPassword);

    UserResponse changeEmail(Integer userId, String currentPassword, String newEmail);

    void deleteAccount(Integer userId, String currentPassword);
}
