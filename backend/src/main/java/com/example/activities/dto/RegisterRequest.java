package com.example.activities.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 12, max = 100, message = "Password must be between 12 and 100 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{12,}$",
            message = "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    private String password;
    
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(ADMIN|USER|MANAGER)$", 
             message = "Role must be one of: ADMIN, USER, MANAGER")
    private String role;

    // Default constructor
    public RegisterRequest() {}

    public String getName() { 
        return name; 
    }
    
    public void setName(String name) {
        // Trim name to avoid accidental spaces at ends
        this.name = name != null ? name.trim() : null;
    }

    public String getEmail() { 
        return email; 
    }
    
    public void setEmail(String email) {
        // Null-safe normalization
        if (email != null) {
            this.email = email.trim().toLowerCase();
        } else {
            this.email = null;
        }
    }

    public String getPassword() { 
        return password; 
    }
    
    public void setPassword(String password) {
        // Passwords should not be trimmed (preserve intentional spaces)
        this.password = password;
    }

    public String getRole() { 
        return role; 
    }
    
    public void setRole(String role) {
        // Null-safe, normalize to uppercase for consistency
        if (role != null) {
            this.role = role.trim().toUpperCase();
        } else {
            this.role = null;
        }
    }
}