package com.example.activities.service;

import com.example.activities.model.ActivityHistory;
import com.example.activities.repository.ActivityHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ActivityHistoryService {

    private final ActivityHistoryRepository repository;

    public List<ActivityHistory> findAll() {
        return repository.findAll();
    }

    public ActivityHistory findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("ActivityHistory not found"));
    }

    public List<ActivityHistory> findByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    public List<ActivityHistory> findByActivityId(String activityId) {
        return repository.findByActivityId(activityId);
    }

    public ActivityHistory save(ActivityHistory entity) {
        validate(entity);
        if (entity.getRegisteredAt() == null) {
            entity.setRegisteredAt(LocalDateTime.now());
        }
        return repository.save(entity);
    }

    public ActivityHistory register(Map<String, String> payload) {
        String activityId = payload.getOrDefault("activityId", "").trim();
        String userId = payload.getOrDefault("userId", "").trim();
        String activityTitle = payload.getOrDefault("activityTitle", "").trim();
        String status = payload.getOrDefault("status", "registered").trim();

        if (!StringUtils.hasText(activityId)) {
            throw new IllegalArgumentException("activityId is required");
        }
        if (!StringUtils.hasText(userId)) {
            throw new IllegalArgumentException("userId is required");
        }
        if (!StringUtils.hasText(status)) {
            status = "registered";
        }

        ActivityHistory existing = repository.findByUserIdAndActivityId(userId, activityId).orElse(null);
        if (existing != null) {
            existing.setStatus(status);
            if (StringUtils.hasText(activityTitle)) {
                existing.setActivityTitle(activityTitle);
            }
            if (!"cancelled".equalsIgnoreCase(status)) {
                existing.setCancelledAt(null);
            } else {
                existing.setCancelledAt(LocalDateTime.now());
            }
            return repository.save(existing);
        }

        ActivityHistory entry = new ActivityHistory();
        entry.setActivityId(activityId);
        entry.setUserId(userId);
        entry.setActivityTitle(activityTitle);
        entry.setStatus(status);
        entry.setRegisteredAt(LocalDateTime.now());
        if ("cancelled".equalsIgnoreCase(status)) {
            entry.setCancelledAt(LocalDateTime.now());
        }
        return repository.save(entry);
    }

    public ActivityHistory markCancelled(String id) {
        ActivityHistory existing = findById(id);
        existing.setStatus("cancelled");
        existing.setCancelledAt(LocalDateTime.now());
        return repository.save(existing);
    }

    public ActivityHistory markAttended(String id) {
        ActivityHistory existing = findById(id);
        existing.setStatus("attended");
        existing.setCancelledAt(null);
        return repository.save(existing);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    private void validate(ActivityHistory entity) {
        if (!StringUtils.hasText(entity.getActivityId())) {
            throw new IllegalArgumentException("activityId is required");
        }
        if (!StringUtils.hasText(entity.getUserId())) {
            throw new IllegalArgumentException("userId is required");
        }
        if (!StringUtils.hasText(entity.getStatus())) {
            throw new IllegalArgumentException("status is required");
        }
    }
}