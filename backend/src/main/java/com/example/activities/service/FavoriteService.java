package com.example.activities.service;

import com.example.activities.model.Favorite;
import com.example.activities.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository repository;

    public List<Favorite> findAll() {
        return repository.findAll();
    }

    public Favorite findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Favorite not found"));
    }

    public List<Favorite> findByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    public Favorite findByUserIdAndActivityId(String userId, String activityId) {
        return repository.findByUserIdAndActivityId(userId, activityId).orElse(null);
    }

    public Favorite save(Favorite entity) {
        if (!StringUtils.hasText(entity.getUserId())) {
            throw new IllegalArgumentException("userId is required");
        }
        if (!StringUtils.hasText(entity.getActivityId())) {
            throw new IllegalArgumentException("activityId is required");
        }

        if (!StringUtils.hasText(entity.getId())) {
            Favorite existing = findByUserIdAndActivityId(entity.getUserId(), entity.getActivityId());
            if (existing != null) {
                return existing;
            }
            entity.setCreatedAt(LocalDateTime.now());
        }

        return repository.save(entity);
    }

    public void deleteByUserIdAndActivityId(String userId, String activityId) {
        repository.deleteByUserIdAndActivityId(userId, activityId);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}