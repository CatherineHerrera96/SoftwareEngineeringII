package com.habitus.authservice.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
}
