/**
 * AuthDtoTest
 * ------------
 * Purpose:
 *   - Verifies that authentication-related DTOs
 *     correctly store and return data
 *   - Ensures API contract consistency between
 *     backend and frontend
 */

package com.habitus.authservice.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class AuthDtoTest {

    @Test
    void loginRequestStoresDataCorrectly() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("secret");

        assertEquals("test@example.com", req.getEmail());
        assertEquals("secret", req.getPassword());
    }

    @Test
    void registerRequestStoresDataCorrectly() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@example.com");
        req.setPassword("123456");

        assertEquals("new@example.com", req.getEmail());
        assertEquals("123456", req.getPassword());
    }

    @Test
    void authResponseStoresToken() {
        AuthResponse res = new AuthResponse("abc123");

        assertEquals("abc123", res.getToken());
    }
}