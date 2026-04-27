package com.example.activities.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "feedbacks")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    // Add additional fields dynamically later if needed.
    
    // Minimal standard fields:
    private String name;
}