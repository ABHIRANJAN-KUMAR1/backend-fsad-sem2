package com.example.activities.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "checkIns",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_checkins_activity_user", columnNames = {"activityId", "userId"})
        }
)
public class CheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String userId;
    private String userName;
    private String activityId;
    private LocalDateTime checkedInAt;
    private String checkedInBy;
    private LocalDateTime checkedOutAt;
}