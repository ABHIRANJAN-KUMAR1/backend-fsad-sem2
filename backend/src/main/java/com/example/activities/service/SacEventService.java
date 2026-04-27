package com.example.activities.service;

import com.example.activities.dto.SacEventRequest;
import com.example.activities.model.Activity;
import com.example.activities.model.EventStatus;
import com.example.activities.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SacEventService {

    private final ActivityRepository activityRepository;

    public List<Activity> getAllEvents() {
        return activityRepository.findAll();
    }

    public List<Activity> getCoordinatorEvents(String coordinatorId) {
        return activityRepository.findByCoordinatorId(coordinatorId);
    }

    public Activity getEventById(String id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found: " + id));
    }

    public Activity createEvent(SacEventRequest request, String creatorId, String creatorEmail) {
        Activity activity = new Activity();
        applyRequest(activity, request);
        activity.setId(null);
        activity.setCoordinatorId(creatorId);
        activity.setCreatedBy(creatorEmail);
        String now = LocalDateTime.now().toString();
        activity.setCreatedAt(now);
        activity.setUpdatedAt(now);
        if (activity.getStatus() == null) {
            activity.setStatus(EventStatus.DRAFT);
        }
        return activityRepository.save(activity);
    }

    public Activity updateEvent(String id, SacEventRequest request) {
        Activity activity = getEventById(id);
        applyRequest(activity, request);
        activity.setUpdatedAt(LocalDateTime.now().toString());
        return activityRepository.save(activity);
    }

    public void deleteEvent(String id) {
        activityRepository.deleteById(id);
    }

    private void applyRequest(Activity activity, SacEventRequest request) {
        if (request.getTitle() != null) activity.setTitle(request.getTitle());
        if (request.getDescription() != null) activity.setDescription(request.getDescription());
        if (request.getCategory() != null) activity.setCategory(request.getCategory());
        if (request.getDate() != null) activity.setDate(request.getDate());
        if (request.getStartTime() != null) activity.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) activity.setEndTime(request.getEndTime());
        if (request.getVenue() != null) activity.setVenue(request.getVenue());
        if (request.getMaxParticipants() != null) activity.setMaxParticipants(request.getMaxParticipants());
        if (request.getStatus() != null) activity.setStatus(request.getStatus());
    }
}
