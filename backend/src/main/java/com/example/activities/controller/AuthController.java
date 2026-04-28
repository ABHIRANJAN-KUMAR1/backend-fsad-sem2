package com.example.activities.controller;

import com.example.activities.dto.RegisterRequest;
import com.example.activities.dto.LoginRequest;
import com.example.activities.dto.ResendOtpRequest;
import com.example.activities.dto.VerifyOtpRequest;
import com.example.activities.model.User;
import com.example.activities.security.JwtUtils;
import com.example.activities.service.UserService;
import com.example.activities.service.VerificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AuthController {

    private final UserService userService;
    private final VerificationService verificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    // private final AuthenticationManager authenticationManager;
    // private final AuthService authService; // Not needed for registration

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        Optional<User> existingUser = userService.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (!Boolean.TRUE.equals(user.getIsVerified())) {
                try {
                    verificationService.issueTokenWithCooldown(user);
                } catch (IllegalStateException ex) {
                    if (ex.getMessage() != null && (ex.getMessage().contains("spring.mail.username") || ex.getMessage().contains("Email sending failed"))) {
                        throw ex;
                    }
                    // Intentionally return the same message to avoid account enumeration signals.
                }
            }
            return ResponseEntity.ok(Map.of("message", "If eligible, a verification code has been sent to your email."));
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        //user.setRole(request.getRole());
        System.out.println("ROLE FROM FRONTEND: " + request.getRole());

String role = request.getRole();

if (role == null || role.isBlank()) {
    role = "student";
} else {
    role = role.toLowerCase();
}

user.setRole(role);
        
        user.setIsVerified(false);
        user.setIsActive(false);
        user = userService.save(user);

        try {
            verificationService.issueTokenWithCooldown(user);
        } catch (IllegalStateException ex) {
            userService.delete(user.getId());
            throw ex;
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Registration successful. Please verify your email to activate your account.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean success = verificationService.verifyAndActivate(request.getEmail(), request.getOtp());
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can login now."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> optionalUser = userService.findByEmail(request.getEmail());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }
        User user = optionalUser.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        if (!user.getIsVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Account is not active. Please verify your email first."));
        }

        if (!user.getIsActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Account is not active. Please verify your email first."));
        }

        String jwt = jwtUtils.generateToken(user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
        return ResponseEntity.ok(response);
    }

    // Resend OTP
    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        Optional<User> optionalUser = userService.findByEmail(request.getEmail());
        if (optionalUser.isPresent() && !Boolean.TRUE.equals(optionalUser.get().getIsVerified())) {
            try {
                verificationService.issueTokenWithCooldown(optionalUser.get());
            } catch (IllegalStateException ex) {
                if (ex.getMessage() != null && (ex.getMessage().contains("spring.mail.username") || ex.getMessage().contains("Email sending failed"))) {
                    throw ex;
                }
                // Keep response generic to prevent account enumeration.
            }
        }

        return ResponseEntity.ok(Map.of("message", "If eligible, a verification code has been sent."));
    }
}

