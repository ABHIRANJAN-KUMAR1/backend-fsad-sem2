package com.example.activities.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "verification_tokens", uniqueConstraints = @UniqueConstraint(columnNames = "token"))
public class VerificationToken {

    @Id
    @GeneratedValue
    @UuidGenerator
    private String id;

    @Column(nullable = false, unique = true, length = 6)
    private String token;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private LocalDateTime expiry;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false)
    private int failedAttempts = 0;

    @Column(nullable = false)
    private LocalDateTime lastSentAt = LocalDateTime.now();

    private LocalDateTime lockedUntil;
}

