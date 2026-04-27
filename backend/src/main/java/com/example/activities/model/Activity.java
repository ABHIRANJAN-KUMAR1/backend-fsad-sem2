package com.example.activities.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;
    private String date;
    private String startTime;
    private String endTime;
    private String venue;
    private Integer maxParticipants;
    private String createdBy;
    private String coordinatorId;
    private String createdAt;
    private String updatedAt;
    @Enumerated(EnumType.STRING)
    private EventStatus status = EventStatus.DRAFT;

    // Participants stored as a collection table
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "activity_participants", joinColumns = @JoinColumn(name = "activity_id"))
    @Column(name = "user_id")
    private List<String> currentParticipants = new ArrayList<>();

    // Waitlist stored as a collection table
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "activity_waitlist", joinColumns = @JoinColumn(name = "activity_id"))
    @Column(name = "user_id")
    private List<String> waitlist = new ArrayList<>();

    // Tags stored as a collection table
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "activity_tags", joinColumns = @JoinColumn(name = "activity_id"))
    @Column(name = "tag_id")
    private List<String> tags = new ArrayList<>();

    // Complex sub-objects are managed client-side; return empty arrays so
    // frontend never gets null on activity.comments or activity.ratings
    @Transient
    private List<Object> comments = new ArrayList<>();

    @Transient
    private List<Object> ratings = new ArrayList<>();
}