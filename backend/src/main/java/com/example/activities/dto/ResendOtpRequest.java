package com.example.activities.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResendOtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    // Default constructor (optional but good practice)
    public ResendOtpRequest() {}

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        // Null-safe normalization: trim and lowercase, or set to null if input is null
        this.email = email == null ? null : email.trim().toLowerCase();
    }
}