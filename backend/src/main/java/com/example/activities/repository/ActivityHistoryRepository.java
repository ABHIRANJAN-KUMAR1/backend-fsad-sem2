package com.example.activities.repository;

import com.example.activities.model.ActivityHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityHistoryRepository extends JpaRepository<ActivityHistory, String> {
    List<ActivityHistory> findByUserId(String userId);

    List<ActivityHistory> findByActivityId(String activityId);

    Optional<ActivityHistory> findByUserIdAndActivityId(String userId, String activityId);
}