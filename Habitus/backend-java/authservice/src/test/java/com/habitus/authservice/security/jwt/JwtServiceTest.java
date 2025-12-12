/**
 * JwtServiceTest
 * ----------------
 * Purpose:
 *   - Verify that JWT tokens are correctly generated and parsed
 *   - Ensures that extractEmail() returns the same email used to generate the token
 */

package com.habitus.authservice.security.jwt;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class JwtServiceTest {

    @Test
    void testTokenEmailExtraction() {
        JwtService jwtService = new JwtService();
        String email = "test@example.com";

        String token = jwtService.generateToken(email);
        assertNotNull(token);

        String extracted = jwtService.extractEmail(token);
        assertEquals(email, extracted);
    }

    @Test
    void testPasswordResetTokenEmailExtraction() {
        JwtService jwtService = new JwtService();
        String email = "reset@example.com";

        String token = jwtService.generatePasswordResetToken(email);
        assertNotNull(token);

        String extracted = jwtService.extractEmail(token);
        assertEquals(email, extracted);
    }
}