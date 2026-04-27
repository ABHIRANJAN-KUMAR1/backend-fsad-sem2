package com.example.activities.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthUser {
    private String id;
    private String email;
    private String role;
}
