package com.example.activities.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class VerifyOtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "\\d{6}", message = "OTP must be exactly 6 digits")
    private String otp;

    // Default constructor (optional but recommended)
    public VerifyOtpRequest() {}

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        // Normalize: trim and lowercase, or keep null
        this.email = email == null ? null : email.trim().toLowerCase();
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        // Sanitize OTP: remove all whitespace and check for null
        if (otp == null) {
            this.otp = null;
        } else {
            // Remove all whitespace characters (spaces, tabs, newlines)
            String sanitized = otp.replaceAll("\\s", "");
            // Optionally keep only digits (though pattern validation will catch)
            this.otp = sanitized;
        }
    }
}