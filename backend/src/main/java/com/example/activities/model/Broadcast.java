package com.example.activities.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "broadcasts")
public class Broadcast {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 20)
    private String targetRole; // all | student | admin | coordinator

    @Column(nullable = false, length = 20)
    private String type; // info | success | warning | error

    @Column(nullable = false)
    private Boolean sendEmail = false;

    @Column(nullable = false)
    private Integer recipientCount = 0;

    @Column(nullable = false)
    private Integer emailSentCount = 0;

    @Column(nullable = false)
    private Integer emailFailedCount = 0;

    @Column(columnDefinition = "TEXT")
    private String failureReason;

    @Column(nullable = false, length = 20)
    private String status = "DRAFT"; // DRAFT | SENT | PARTIAL | FAILED

    @Column(nullable = false)
    private String createdBy;

    private LocalDateTime sentAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}