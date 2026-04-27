package com.example.activities.dto;

import lombok.Data;

@Data
public class BroadcastRequest {
    private String title;
    private String message;
    private String targetRole;
    private String type;
    private Boolean sendEmail;
}
