package com.example.activities.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.activities.model.User;
import com.example.activities.repository.UserRepository;
import com.example.activities.security.AuthService;
import com.example.activities.security.AuthUser;
import com.example.activities.security.JwtUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<?> getAllUsers(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthUser authUser = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(authUser, "admin", "coordinator")) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: admin or coordinator role required"));
        }

        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(this::toSafeUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/students")
    public ResponseEntity<?> getRegisteredStudents(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthUser authUser = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(authUser, "admin", "coordinator")) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: admin or coordinator role required"));
        }

        return ResponseEntity.ok(
                userRepository.findByRoleIgnoreCase("student").stream()
                        .map(this::toSafeUser)
                        .collect(Collectors.toList())
        );
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        return ResponseEntity.status(410).body(Map.of(
                "error", "This endpoint is deprecated. Use /api/auth/register with email verification."
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        return ResponseEntity.status(410).body(Map.of(
                "error", "This endpoint is deprecated. Use /api/auth/login after verifying your email."
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing or invalid token format"));
        }
        String token = authHeader.substring(7);
        try {
            String email = jwtUtils.getUsernameFromToken(token);
            User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (user != null) {
                // CRITICAL FIX: Never return the full User entity (contains password hash)
                return ResponseEntity.ok(toSafeUser(user));
            }
        } catch (Exception e) {
            // Token expired, malformed, or any other error
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {

        AuthUser authUser = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(authUser, "admin")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admin can delete users"));
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        if (!"student".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only student accounts can be deleted via this endpoint"));
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "deleted", "id", id));
    }

    private Map<String, Object> toSafeUser(User user) {
        Map<String, Object> safeUser = new HashMap<>();
        safeUser.put("id", user.getId());
        safeUser.put("name", user.getName());
        safeUser.put("email", user.getEmail());
        safeUser.put("role", user.getRole());
        safeUser.put("isActive", user.getIsActive());
        safeUser.put("isVerified", user.getIsVerified());
        safeUser.put("createdAt", user.getCreatedAt());
        safeUser.put("updatedAt", user.getUpdatedAt());
        return safeUser;
    }
}