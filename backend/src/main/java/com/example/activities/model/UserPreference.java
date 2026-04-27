package com.example.activities.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Data
@Entity
@Table(name = "userPreferences")
public class UserPreference {

    @Id
    private String id;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_preference_category_preferences", joinColumns = @JoinColumn(name = "preference_id"))
    @MapKeyColumn(name = "category")
    @Column(name = "score")
    private Map<String, Integer> categoryPreferences = new HashMap<>();

    private String timePreference = "afternoon";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_preference_venues", joinColumns = @JoinColumn(name = "preference_id"))
    @Column(name = "venue")
    private java.util.List<String> venuePreferences = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_preference_activity_counts", joinColumns = @JoinColumn(name = "preference_id"))
    @MapKeyColumn(name = "category")
    @Column(name = "count")
    private Map<String, Integer> activityCountByCategory = new HashMap<>();

    private Integer totalActivities = 0;

    private Double averageRatingGiven = 0.0;

    private String dayPreference = "any";

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void touchUpdatedAt() {
        updatedAt = LocalDateTime.now();
    }
}