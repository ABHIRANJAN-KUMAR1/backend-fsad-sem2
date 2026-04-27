package com.example.activities.security;

import com.example.activities.model.User;
import com.example.activities.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public AuthUser resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            String email = jwtUtils.getUsernameFromToken(token);
            User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (user == null) {
                return null;
            }
            return new AuthUser(user.getId(), user.getEmail(), normalizeRole(user.getRole()));
        } catch (Exception ex) {
            return null;
        }
    }

    public boolean hasAnyRole(AuthUser user, String... roles) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        for (String role : roles) {
            if (user.getRole().equalsIgnoreCase(role)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toLowerCase();
    }
}
