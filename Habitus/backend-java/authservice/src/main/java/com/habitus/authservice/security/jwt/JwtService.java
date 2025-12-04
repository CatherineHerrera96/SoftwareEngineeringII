package com.habitus.authservice.security.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

/**
 * Service responsible for JWT token generation and validation.
 * Servicio responsable de la generación y validación de tokens JWT.
 * 
 * Single Responsibility: Encapsulates all JWT-related operations.
 * Responsabilidad única: Encapsula todas las operaciones relacionadas con JWT.
 */
@Service
public class JwtService {

    // In production, load this from environment variables
    // En producción, cargar esto desde variables de entorno
    // MVP: Hardcoded secret for simplicity and sharing with Python backend
    // MVP: Secreto codificado para simplicidad y compartir con backend Python
    private static final String SECRET = "my_super_secret_key_for_habitus_mvp_123456789";
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    /**
     * Generates a JWT token for the authenticated user.
     * Genera un token JWT para el usuario autenticado.
     * 
     * @param email User's email address used as subject / Correo electrónico del
     *              usuario usado como sujeto
     * @return JWT token string / Cadena de token JWT
     */
    public String generateToken(String email) {
        long expirationMs = 1000 * 60 * 60 * 24; // 24 hours / 24 horas

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    /**
     * Extracts email from a JWT token.
     * Extrae el email de un token JWT.
     * 
     * @param token JWT token to parse / Token JWT a analizar
     * @return User email from token / Email del usuario del token
     */
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
